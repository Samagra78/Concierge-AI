import { Vendor } from '@concierge/shared';
import { VendorChannel, OutboundMessage, InboundMessage, SendResult } from './channel.interface';

/**
 * Voice Channel Stub (Spec.md Section 6.4)
 * For v1, phone fallback is human-assisted (click-to-call card).
 * Automated AI voice call adapter is a future extension stubbed here.
 */
export class VoiceChannelStub implements VendorChannel {
  id: 'voice' = 'voice';

  canInitiate(vendor: Vendor): boolean {
    return Boolean(vendor.phone);
  }

  async send(vendor: Vendor, _msg: OutboundMessage): Promise<SendResult> {
    return {
      success: false,
      error: 'Autonomous AI voice calls are not enabled in v1. Use human-assisted click-to-call card.',
    };
  }

  parseInbound(raw: unknown): InboundMessage {
    return {
      externalId: String(Date.now()),
      text: '',
      rawPayload: raw,
      timestamp: new Date(),
    };
  }
}
