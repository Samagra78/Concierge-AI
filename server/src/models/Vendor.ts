import { Schema, model, Document } from 'mongoose';
import { GeoPoint, VendorChannels } from '@concierge/shared';

export interface IVendorDocument extends Document {
  placeId: string;
  name: string;
  phone?: string;
  address: string;
  geo: GeoPoint;
  rating?: number;
  userRatingsTotal?: number;
  categories: string[];
  optedOut: boolean;
  channels: VendorChannels;
  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

const vendorChannelsSchema = new Schema(
  {
    telegramChatId: { type: String },
    whatsappId: { type: String },
  },
  { _id: false }
);

const vendorSchema = new Schema<IVendorDocument>(
  {
    placeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, required: true },
    geo: { type: geoPointSchema, required: true },
    rating: { type: Number, min: 0, max: 5 },
    userRatingsTotal: { type: Number, default: 0 },
    categories: { type: [String], default: [], index: true },
    optedOut: { type: Boolean, default: false, index: true },
    channels: { type: vendorChannelsSchema, default: {} },
  },
  { timestamps: true }
);

// 2dsphere index for location queries
vendorSchema.index({ geo: '2dsphere' });

export const Vendor = model<IVendorDocument>('Vendor', vendorSchema);
