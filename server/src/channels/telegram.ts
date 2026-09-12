import { Vendor } from '@concierge/shared';
import { VendorChannel, OutboundMessage, InboundMessage, SendResult } from './channel.interface';

export class TelegramChannelAdapter implements VendorChannel {
  id: 'telegram' = 'telegram';

  /**
   * Telegram bots cannot cold-message. They can only initiate if the vendor has linked their chatId
   * via /start <inviteToken> (Spec.md Section 3 & 6.2).
   */
  canInitiate(vendor: Vendor): boolean {
    return Boolean(vendor.channels?.telegramChatId);
  }

  async send(vendor: Vendor, msg: OutboundMessage): Promise<SendResult> {
    if (!this.canInitiate(vendor)) {
      return {
        success: false,
        error: 'Cannot message vendor on Telegram: vendor has not linked Telegram chat ID.',
      };
    }

    // In M2 this will call the Telegram Bot API (or grammY / telegraf)
    console.log(`[Telegram] Sending to vendor ${vendor.name} (${vendor.channels.telegramChatId}): ${msg.text}`);
    return {
      success: true,
      messageId: `tg_${Date.now()}`,
    };
  }

  parseInbound(raw: unknown): InboundMessage {
    const payload = raw as { message?: { message_id?: number; text?: string; from?: { id?: number } } };
    return {
      externalId: String(payload.message?.message_id || Date.now()),
      senderChatId: String(payload.message?.from?.id || ''),
      text: payload.message?.text || '',
      rawPayload: raw,
      timestamp: new Date(),
    };
  }
}
