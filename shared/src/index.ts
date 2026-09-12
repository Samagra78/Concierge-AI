export type TaskState =
  | 'DRAFT'
  | 'CLARIFYING'
  | 'DISCOVERING'
  | 'OUTREACH'
  | 'QUOTES_READY'
  | 'AWAITING_APPROVAL'
  | 'CONFIRMING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export const TASK_TERMINAL_STATES: ReadonlyArray<TaskState> = [
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
];

export function isTaskTerminal(state: TaskState): boolean {
  return TASK_TERMINAL_STATES.includes(state);
}

export interface UserAddress {
  label: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface UserBudgetDefaults {
  maxBudget?: number;
  currency?: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  defaultAddresses: UserAddress[];
  budgetDefaults?: UserBudgetDefaults;
  language?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StructuredTaskItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface StructuredTaskLocation {
  locality: string;
  pincode?: string;
  fullAddress?: string; // Hidden from vendors until approved
  lat?: number;
  lng?: number;
}

export interface StructuredTaskTimeWindow {
  earliest?: string | Date;
  latest?: string | Date;
}

export interface StructuredTask {
  category: string; // e.g. "laundry" | "ironing" | "dry_cleaning" | "repairs" | "delivery"
  items: StructuredTaskItem[];
  timeWindow?: StructuredTaskTimeWindow;
  location: StructuredTaskLocation;
  budgetMax?: number;
  notes?: string;
}

export interface Task {
  _id: string;
  userId: string;
  category: string;
  rawRequest: string;
  structured: StructuredTask;
  state: TaskState;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type VendorChannelId = 'telegram' | 'whatsapp' | 'voice';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat] per GeoJSON format
}

export interface VendorChannels {
  telegramChatId?: string;
  whatsappId?: string;
}

export interface Vendor {
  _id: string;
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface VendorInvite {
  _id: string;
  vendorId: string;
  taskId: string;
  token: string;
  expiresAt: string | Date;
  usedAt?: string | Date;
  createdAt?: string | Date;
}

export type ConversationState = 'open' | 'negotiating' | 'quoted' | 'closed' | 'opted_out';

export interface Conversation {
  _id: string;
  taskId: string;
  vendorId: string;
  channel: VendorChannelId;
  state: ConversationState;
  roundCount: number;
  lastActivityAt: string | Date;
  createdAt?: string | Date;
}

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  _id: string;
  conversationId: string;
  direction: MessageDirection;
  channel: VendorChannelId;
  text: string;
  translatedText?: string;
  ts: string | Date;
  externalId?: string;
}

export type QuoteStatus = 'proposed' | 'countered' | 'accepted_by_vendor' | 'expired' | 'rejected';

export interface QuoteLineItem {
  label: string;
  qty: number;
  unitPrice: number;
}

export interface PickupSlot {
  start: string | Date;
  end: string | Date;
}

export interface Quote {
  _id: string;
  vendorId: string;
  taskId: string;
  lineItems: QuoteLineItem[];
  pickupFee: number;
  dropFee: number;
  total: number;
  currency: string; // default INR
  pickupSlots: PickupSlot[];
  turnaroundHours: number;
  cancellationTerms?: string;
  validUntil?: string | Date;
  rawMessageIds: string[];
  status: QuoteStatus;
  createdAt?: string | Date;
}

export type ApprovalStatus = 'pending' | 'granted' | 'rejected' | 'expired';

export interface Approval {
  _id: string;
  taskId: string;
  quoteId: string;
  quoteSnapshot: Quote; // frozen copy shown to user
  status: ApprovalStatus;
  decidedBy?: string;
  decidedAt?: string | Date;
  expiresAt: string | Date;
  createdAt?: string | Date;
}

export type BookingStatus =
  | 'confirmed'
  | 'scheduled'
  | 'picked_up'
  | 'in_progress'
  | 'delivered'
  | 'cancelled';

export interface Booking {
  _id: string;
  taskId: string;
  vendorId: string;
  quoteId: string;
  pickupSlot: PickupSlot;
  dropSlot?: PickupSlot;
  status: BookingStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type PaymentMethod = 'upi' | 'cash';

export interface Payment {
  _id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  confirmedByUser: boolean;
  confirmedByVendor?: boolean;
  createdAt?: string | Date;
}

export type AuditActor =
  | 'system'
  | 'user'
  | 'concierge_agent'
  | 'discovery_agent'
  | 'negotiator_agent'
  | 'booking_agent'
  | 'guardrail';

export interface AuditLog {
  _id: string;
  taskId?: string;
  actor: AuditActor;
  action: string;
  payload?: Record<string, unknown>;
  ts: string | Date;
}

export interface AgentSession {
  _id: string;
  sessionId: string;
  taskId?: string;
  agent: string;
  state: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  updatedAt?: string | Date;
}

export type TimelineEventType =
  | 'task.created'
  | 'task.ready'
  | 'vendors.shortlisted'
  | 'vendor.message.received'
  | 'quote.received'
  | 'approval.requested'
  | 'approval.updated'
  | 'booking.confirmed'
  | 'fulfilment.updated'
  | 'payment.pending'
  | 'task.completed'
  | 'task.cancelled';

export interface TimelineEvent {
  type: TimelineEventType;
  taskId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface PolicyConfig {
  maxRoundsPerVendor: number;
  outboundMessagingEnabled: boolean;
  approvalTtlMinutes: number;
  vendorsPerTask: number;
  defaultCurrency: string;
  maxNudgesPerVendor: number;
  minNudgeIntervalHours: number;
}
