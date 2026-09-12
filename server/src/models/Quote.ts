import { Schema, model, Document, Types } from 'mongoose';
import { QuoteStatus, QuoteLineItem, PickupSlot } from '@concierge/shared';

export interface IQuoteDocument extends Document {
  vendorId?: Types.ObjectId;
  vendorName?: string;
  taskId: Types.ObjectId;
  lineItems: QuoteLineItem[];
  pickupFee: number;
  dropFee: number;
  total: number;
  currency: string;
  pickupSlots: PickupSlot[];
  turnaroundHours: number;
  cancellationTerms?: string;
  validUntil?: Date;
  rawMessageIds: Types.ObjectId[];
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<QuoteLineItem>(
  {
    label: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

const pickupSlotSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  { _id: false }
);

const quoteSchema = new Schema<IQuoteDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    vendorName: { type: String, trim: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    pickupFee: { type: Number, default: 0 },
    dropFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    pickupSlots: { type: [pickupSlotSchema], default: [] },
    turnaroundHours: { type: Number, default: 24 },
    cancellationTerms: { type: String },
    validUntil: { type: Date },
    rawMessageIds: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    status: {
      type: String,
      enum: ['proposed', 'countered', 'accepted_by_vendor', 'expired', 'rejected'],
      default: 'proposed',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Quote = model<IQuoteDocument>('Quote', quoteSchema);
