import { Schema, model, Document, Types } from 'mongoose';
import { VendorChannelId, MessageDirection } from '@concierge/shared';

export interface IMessageDocument extends Document {
  conversationId: Types.ObjectId;
  direction: MessageDirection;
  channel: VendorChannelId;
  text: string;
  translatedText?: string;
  ts: Date;
  externalId?: string;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['telegram', 'whatsapp', 'voice'],
      required: true,
    },
    text: { type: String, required: true },
    translatedText: { type: String },
    ts: { type: Date, default: Date.now, required: true },
    externalId: { type: String, index: true },
  },
  { timestamps: false }
);

// Compound index for timeline queries
messageSchema.index({ conversationId: 1, ts: 1 });

export const Message = model<IMessageDocument>('Message', messageSchema);
