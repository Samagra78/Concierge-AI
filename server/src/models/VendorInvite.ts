import { Schema, model, Document, Types } from 'mongoose';

export interface IVendorInviteDocument extends Document {
  vendorId: Types.ObjectId;
  taskId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const vendorInviteSchema = new Schema<IVendorInviteDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index to automatically purge expired invite tokens from MongoDB
vendorInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VendorInvite = model<IVendorInviteDocument>('VendorInvite', vendorInviteSchema);
