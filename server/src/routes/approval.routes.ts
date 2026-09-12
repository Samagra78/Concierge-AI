import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { Approval } from '../models/Approval';
import { AuditLog } from '../models/AuditLog';
import { Task } from '../models/Task';

const router = Router();

router.use(requireAuth);

// POST /approvals/:id/grant
router.post('/:id/grant', async (req: Request, res: Response): Promise<void> => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval record not found' });
      return;
    }
    const ownedTask = await Task.findOne({ _id: approval.taskId, userId: req.user?.userId }).select('_id');
    if (!ownedTask) {
      res.status(404).json({ success: false, error: 'Approval record not found' });
      return;
    }

    if (new Date() > new Date(approval.expiresAt)) {
      approval.status = 'expired';
      await approval.save();
      res.status(400).json({ success: false, error: 'Approval request has expired' });
      return;
    }

    approval.status = 'granted';
    approval.decidedBy = new Types.ObjectId(req.user?.userId);
    approval.decidedAt = new Date();
    await approval.save();

    await AuditLog.create({
      taskId: approval.taskId,
      actor: 'user',
      action: 'approval.granted',
      payload: { approvalId: approval._id, quoteId: approval.quoteId },
    });

    res.json({ success: true, approval });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /approvals/:id/reject
router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      res.status(404).json({ success: false, error: 'Approval record not found' });
      return;
    }
    const ownedTask = await Task.findOne({ _id: approval.taskId, userId: req.user?.userId }).select('_id');
    if (!ownedTask) {
      res.status(404).json({ success: false, error: 'Approval record not found' });
      return;
    }

    approval.status = 'rejected';
    approval.decidedBy = new Types.ObjectId(req.user?.userId);
    approval.decidedAt = new Date();
    await approval.save();

    await AuditLog.create({
      taskId: approval.taskId,
      actor: 'user',
      action: 'approval.rejected',
      payload: { approvalId: approval._id, quoteId: approval.quoteId },
    });

    res.json({ success: true, approval });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
