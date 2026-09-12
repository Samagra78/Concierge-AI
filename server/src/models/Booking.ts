import { Schema, model, Document, Types } from 'mongoose';
import { BookingStatus, PickupSlot } from '@concierge/shared';

export interface IBookingDocument extends Document {
  taskId: Types.ObjectId;
  vendorId: Types.ObjectId;
  quoteId: Types.ObjectId;
  pickupSlot: PickupSlot;
  dropSlot?: PickupSlot;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBookingDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', required: true, index: true },
    pickupSlot: { type: slotSchema, required: true },
    dropSlot: { type: slotSchema },
    status: {
      type: String,
      enum: ['confirmed', 'scheduled', 'picked_up', 'in_progress', 'delivered', 'cancelled'],
      default: 'confirmed',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Booking = model<IBookingDocument>('Booking', bookingSchema);
