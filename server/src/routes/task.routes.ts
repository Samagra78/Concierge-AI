import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { Task } from '../models/Task';
import { Quote } from '../models/Quote';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { Approval } from '../models/Approval';
import { Types } from 'mongoose';

const router = Router();

// Protect all task endpoints
router.use(requireAuth);

// GET /tasks - List all tasks for current user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.user?.userId }).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /tasks - Create a task from natural language or structured input
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawRequest, category, structured } = req.body;

    if (!rawRequest) {
      res.status(400).json({ success: false, error: 'rawRequest is required' });
      return;
    }

    const newTask = await Task.create({
      userId: req.user?.userId,
      category: category || 'errand',
      rawRequest,
      structured: structured || {
        category: category || 'errand',
        items: [],
        location: { locality: 'Nearby' },
      },
      state: 'DRAFT',
    });

    // Record audit log
    await AuditLog.create({
      taskId: newTask._id,
      actor: 'user',
      action: 'task.created',
      payload: { rawRequest },
    });

    res.status(201).json({ success: true, task: newTask });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /tasks/:id - Task details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user?.userId });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /tasks/:id/messages - User replies to agent (clarifications)
router.post('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const task = await Task.findOne({ _id: req.params.id, userId: req.user?.userId });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    // Append to audit log
    await AuditLog.create({
      taskId: task._id,
      actor: 'user',
      action: 'user.message.received',
      payload: { text },
    });

    res.json({ success: true, message: 'Message received', taskId: task._id });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /tasks/:id/quotes - Normalised quotes for comparison
router.get('/:id/quotes', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user?.userId }).select('_id');
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    const quotes = await Quote.find({ taskId: req.params.id }).populate('vendorId', 'name rating phone address');
    res.json({ success: true, quotes });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /tasks/:id/cancel - User cancels errand
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { state: 'CANCELLED' },
      { new: true }
    );
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    await AuditLog.create({
      taskId: task._id,
      actor: 'user',
      action: 'task.cancelled',
    });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /tasks/:id/payment-confirmation - Direct payment logged by user (Spec.md Section 8 & 11)
router.post('/:id/payment-confirmation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, method = 'upi', reference, approvalId } = req.body;
    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || typeof method !== 'string' || method.length > 40 || (reference !== undefined && (typeof reference !== 'string' || reference.length > 160)) || typeof approvalId !== 'string' || !Types.ObjectId.isValid(approvalId)) {
      res.status(400).json({ success: false, error: 'A valid approved quote, positive payment amount, method, and optional reference are required.' });
      return;
    }
    const approval = await Approval.findOne({ _id: approvalId, taskId: req.params.id, status: 'granted', decidedBy: req.user?.userId });
    if (!approval) { res.status(403).json({ success: false, error: 'Approve this errand quote before confirming payment.' }); return; }
    const approvedQuote = await Quote.findOne({ _id: approval.quoteId, taskId: req.params.id }).select('total');
    if (!approvedQuote || Math.abs(approvedQuote.total - paymentAmount) > 0.01) {
      res.status(400).json({ success: false, error: 'Payment amount must match the approved quote.' });
      return;
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId, paymentConfirmedAt: { $exists: false } },
      { $set: { state: 'COMPLETED', paymentAmount, paymentMethod: method.trim(), paymentReference: typeof reference === 'string' ? reference.trim() : undefined, paymentConfirmedAt: new Date() } },
      { new: true }
    );

    if (!task) {
      const ownedTask = await Task.findOne({ _id: req.params.id, userId: req.user?.userId }).select('_id paymentConfirmedAt');
      if (ownedTask?.paymentConfirmedAt) {
        res.status(409).json({ success: false, error: 'Payment has already been recorded for this errand.' });
        return;
      }
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    const purchase = {
      id: `errand-${task._id}`,
      category: 'Errand',
      title: `Errand purchase: ${task.rawRequest.slice(0, 120)}`,
      amount: paymentAmount,
      currency: 'INR',
      date: task.paymentConfirmedAt!.toISOString(),
      status: 'Confirmed',
      sourceTaskId: task._id,
      paymentMethod: task.paymentMethod,
      reference: task.paymentReference,
    };
    const owner = await User.findByIdAndUpdate(req.user?.userId, { $push: { 'workspace.expenses': purchase } }, { new: true });
    if (!owner) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    await AuditLog.create({
      taskId: task._id,
      actor: 'user',
      action: 'task.completed',
      payload: { amount: paymentAmount, method: task.paymentMethod, reference: task.paymentReference },
    });

    res.json({ success: true, message: 'Payment confirmed. Errand completed.', task, purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /tasks/:id/events - SSE stream of live timeline updates (Spec.md Section 11)
router.get('/:id/events', async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params.id;
  try {
    const task = await Task.findOne({ _id: taskId, userId: req.user?.userId }).select('_id');
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
  } catch (error) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', taskId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat interval to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

export default router;
