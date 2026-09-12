import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod } from '@concierge/shared';

export interface IPaymentDocument extends Document {
  bookingId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  confirmedByUser: boolean;
  confirmedByVendor?: boolean;
  createdAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'cash'],
      required: true,
      default: 'upi',
    },
    reference: { type: String },
    confirmedByUser: { type: Boolean, default: false },
    confirmedByVendor: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Payment = model<IPaymentDocument>('Payment', paymentSchema);
