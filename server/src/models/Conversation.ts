import { Schema, model, Document, Types } from 'mongoose';
import { VendorChannelId, ConversationState } from '@concierge/shared';

export interface IConversationDocument extends Document {
  taskId: Types.ObjectId;
  vendorId: Types.ObjectId;
  channel: VendorChannelId;
  state: ConversationState;
  roundCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    channel: {
      type: String,
      enum: ['telegram', 'whatsapp', 'voice'],
      required: true,
      default: 'telegram',
    },
    state: {
      type: String,
      enum: ['open', 'negotiating', 'quoted', 'closed', 'opted_out'],
      default: 'open',
      required: true,
    },
    roundCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index: One conversation per (taskId, vendorId)
conversationSchema.index({ taskId: 1, vendorId: 1 }, { unique: true });

export const Conversation = model<IConversationDocument>('Conversation', conversationSchema);
