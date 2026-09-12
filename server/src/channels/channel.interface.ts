import { Vendor, VendorChannelId, MessageDirection } from '@concierge/shared';

export interface OutboundMessage {
  text: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  replyMarkup?: Record<string, unknown>;
}

export interface InboundMessage {
  externalId: string;
  senderPhone?: string;
  senderChatId?: string;
  text: string;
  rawPayload: unknown;
  timestamp: Date;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VendorChannel {
  id: VendorChannelId;
  canInitiate(vendor: Vendor): boolean;
  send(vendor: Vendor, msg: OutboundMessage): Promise<SendResult>;
  parseInbound(raw: unknown): InboundMessage;
}
