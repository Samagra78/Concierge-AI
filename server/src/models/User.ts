import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserAddress, UserBudgetDefaults } from '@concierge/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phoneNumber?: string;
  homeCity?: string;
  countryOfResidence?: string;
  preferredCurrency: string;
  timezone?: string;
  lastLoginAt?: Date;
  defaultAddresses: UserAddress[];
  budgetDefaults?: UserBudgetDefaults;
  role: 'admin' | 'user';
  onboardingCompleted: boolean;
  preferences?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const addressSchema = new Schema<UserAddress>(
  {
    label: { type: String, required: true },
    street: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const preferencesSchema = new Schema({
  budgetPerDay: { type: Number, min: 0 },
  luxuryLevel: { type: Number, min: 1, max: 5 },
  maxDailyWalkKm: { type: Number, min: 0 },
  earliestWakeTime: { type: String, trim: true },
  crowdTolerance: { type: String, enum: ['Low', 'Medium', 'High'] },
  interests: { type: [String], default: [] },
  lifestyleRules: {
    vegetarianOnly: { type: Boolean, default: false },
    noEarlyFlights: { type: Boolean, default: false },
    mustHaveGym: { type: Boolean, default: false },
  },
}, { _id: false, strict: false });

const tripOverviewSchema = new Schema({
  title: { type: String, trim: true },
  destination: { type: String, trim: true },
  durationDays: { type: Number, min: 0 },
  totalBudget: { type: Number, min: 0 },
  allocatedBudget: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  summary: { type: String },
  tags: { type: [String], default: [] },
}, { _id: false, strict: false });

const expenseSchema = new Schema({
  id: { type: String, required: true },
  category: { type: String, required: true, enum: ['Accommodation', 'Dining', 'Groceries', 'Transit', 'Flights', 'Experience', 'Activities', 'Shopping', 'Errand', 'Insurance', 'Visa', 'Health', 'Communication', 'Other'] },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, default: 'INR' },
  date: { type: String, required: true },
  status: { type: String, enum: ['Pre-paid', 'Confirmed', 'Estimated'], default: 'Confirmed' },
}, { timestamps: true, strict: false });

const tripPageSchema = new Schema({
  id: { type: String, required: true },
  tripOverview: { type: tripOverviewSchema, required: true },
  itineraryDays: { type: [Schema.Types.Mixed], default: [] },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { _id: false, strict: false });

const workspaceSchema = new Schema({
  tripOverview: { type: tripOverviewSchema },
  itineraryDays: { type: [Schema.Types.Mixed], default: undefined },
  tripPages: { type: [tripPageSchema], default: undefined },
  activeTripId: { type: String, default: undefined },
  expenses: { type: [expenseSchema], default: undefined },
  pastTrips: { type: [Schema.Types.Mixed], default: undefined },
}, { _id: false, strict: false });

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true, maxlength: 32 },
    homeCity: { type: String, trim: true, maxlength: 100 },
    countryOfResidence: { type: String, trim: true, maxlength: 100 },
    preferredCurrency: { type: String, default: 'INR', trim: true, uppercase: true, maxlength: 3 },
    timezone: { type: String, trim: true, maxlength: 80 },
    lastLoginAt: { type: Date },
    defaultAddresses: { type: [addressSchema], default: [] },
    budgetDefaults: {
      maxBudget: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true, index: true },
    onboardingCompleted: { type: Boolean, default: false },
    preferences: { type: preferencesSchema, default: undefined },
    workspace: { type: workspaceSchema, default: undefined },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<IUserDocument>('User', userSchema);
