import { Vendor } from '@concierge/shared';
import { VendorChannel, OutboundMessage, InboundMessage, SendResult } from './channel.interface';

export class WhatsAppChannelAdapter implements VendorChannel {
  id: 'whatsapp' = 'whatsapp';

  /**
   * WhatsApp can initiate contact if we have a phone number, via pre-approved templates
   * (Spec.md Section 6.3).
   */
  canInitiate(vendor: Vendor): boolean {
    return Boolean(vendor.phone);
  }

  async send(vendor: Vendor, msg: OutboundMessage): Promise<SendResult> {
    if (!this.canInitiate(vendor)) {
      return {
        success: false,
        error: 'Cannot message vendor on WhatsApp: no phone number found.',
      };
    }

    // In M2 this will call Meta's WhatsApp Cloud API
    console.log(`[WhatsApp] Sending to vendor ${vendor.name} (${vendor.phone}): ${msg.text}`);
    return {
      success: true,
      messageId: `wa_${Date.now()}`,
    };
  }

  parseInbound(raw: unknown): InboundMessage {
    const payload = raw as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{ id?: string; from?: string; text?: { body?: string } }>;
          };
        }>;
      }>;
    };

    const firstMsg = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    return {
      externalId: firstMsg?.id || String(Date.now()),
      senderPhone: firstMsg?.from || '',
      text: firstMsg?.text?.body || '',
      rawPayload: raw,
      timestamp: new Date(),
    };
  }
}
