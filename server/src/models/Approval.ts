import { Schema, model, Document, Types } from 'mongoose';
import { ApprovalStatus, Quote } from '@concierge/shared';

export interface IApprovalDocument extends Document {
  taskId: Types.ObjectId;
  quoteId: Types.ObjectId;
  quoteSnapshot: Quote;
  status: ApprovalStatus;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalSchema = new Schema<IApprovalDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', required: true, index: true },
    quoteSnapshot: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'granted', 'rejected', 'expired'],
      default: 'pending',
      required: true,
      index: true,
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const Approval = model<IApprovalDocument>('Approval', approvalSchema);
