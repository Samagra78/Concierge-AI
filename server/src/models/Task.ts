import { Schema, model, Document, Types } from 'mongoose';
import { TaskState, StructuredTask } from '@concierge/shared';

export interface ITaskDocument extends Document {
  userId: Types.ObjectId;
  category: string;
  rawRequest: string;
  structured: StructuredTask;
  state: TaskState;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const structuredItemSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    notes: { type: String },
  },
  { _id: false }
);

const structuredLocationSchema = new Schema(
  {
    locality: { type: String, required: true },
    pincode: { type: String },
    fullAddress: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const structuredTimeWindowSchema = new Schema(
  {
    earliest: { type: Date },
    latest: { type: Date },
  },
  { _id: false }
);

const structuredTaskSchema = new Schema(
  {
    category: { type: String, required: true },
    items: { type: [structuredItemSchema], default: [] },
    timeWindow: { type: structuredTimeWindowSchema },
    location: { type: structuredLocationSchema, required: true },
    budgetMax: { type: Number },
    notes: { type: String },
  },
  { _id: false }
);

const taskSchema = new Schema<ITaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, index: true },
    rawRequest: { type: String, required: true },
    structured: { type: structuredTaskSchema, required: true },
    state: {
      type: String,
      enum: [
        'DRAFT',
        'CLARIFYING',
        'DISCOVERING',
        'OUTREACH',
        'QUOTES_READY',
        'AWAITING_APPROVAL',
        'CONFIRMING',
        'SCHEDULED',
        'IN_PROGRESS',
        'DELIVERED',
        'PAYMENT_PENDING',
        'COMPLETED',
        'FAILED',
        'EXPIRED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    paymentAmount: { type: Number, min: 0 },
    paymentMethod: { type: String, trim: true, maxlength: 40 },
    paymentReference: { type: String, trim: true, maxlength: 160 },
    paymentConfirmedAt: { type: Date },
  },
  { timestamps: true }
);

export const Task = model<ITaskDocument>('Task', taskSchema);
