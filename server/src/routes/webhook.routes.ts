import { Router, Request, Response } from 'express';
import { config } from '../config/env';

const router = Router();

// POST /webhooks/telegram
router.post('/telegram', (req: Request, res: Response): void => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];

  // Verify webhook secret token if configured
  if (config.telegramWebhookSecret && secretHeader !== config.telegramWebhookSecret) {
    res.status(401).json({ error: 'Unauthorized webhook request' });
    return;
  }

  const update = req.body;
  console.log('[Telegram Webhook] Received update:', JSON.stringify(update));

  // Acknowledge update immediately
  res.status(200).json({ ok: true });
});

// GET /webhooks/whatsapp - Webhook verification by Meta
router.get('/whatsapp', (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    console.log('[WhatsApp Webhook] Verification successful');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ error: 'Verification failed' });
});

// POST /webhooks/whatsapp - Inbound messages & status updates
router.post('/whatsapp', (req: Request, res: Response): void => {
  const body = req.body;
  console.log('[WhatsApp Webhook] Received event:', JSON.stringify(body));

  res.status(200).send('EVENT_RECEIVED');
});

export default router;
