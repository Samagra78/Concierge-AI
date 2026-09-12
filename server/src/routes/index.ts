import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import approvalRoutes from './approval.routes';
import webhookRoutes from './webhook.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/approvals', approvalRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/', aiRoutes);
router.use('/ai', aiRoutes);

export default router;
