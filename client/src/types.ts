/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenView = 
  | 'landing' 
  | 'dashboard' 
  | 'timeline' 
  | 'traveler-dna' 
  | 'smart-discovery' 
  | 'expense-tracker' 
  | 'profile'
  | 'wizard';

export interface TravelerDNA {
  budgetPerDay: number;
  luxuryLevel: number; // 1 to 5 (Standard to Ultra-Luxe)
  maxDailyWalkKm: number;
  earliestWakeTime: string;
  crowdTolerance: 'Low' | 'Medium' | 'High';
  interests: string[];
  lifestyleRules: {
    vegetarianOnly: boolean;
    noEarlyFlights: boolean;
    mustHaveGym: boolean;
  };
}

export interface ActivitySlot {
  id: string;
  time: string;
  title: string;
  category: 'Culture' | 'Foodie' | 'Architecture' | 'Modern Art' | 'Nightlife' | 'Nature' | 'Accommodation' | 'Food & Drink' | 'Travel & Transport' | 'Attractions';
  categoryBgColor?: string;
  description: string;
  duration: string;
  cost: string;
  imageUrl: string;
  isLocked: boolean;
  coordinates?: { lat: number; lng: number };
  replanOptions?: Array<{
    title: string;
    description: string;
    category: 'Culture' | 'Foodie' | 'Architecture' | 'Modern Art' | 'Nightlife' | 'Nature' | 'Accommodation' | 'Food & Drink' | 'Travel & Transport' | 'Attractions';
    duration: string;
    cost: string;
    imageUrl: string;
  }>;
}

export interface TransitSlot {
  id: string;
  type: 'train' | 'walk' | 'car';
  description: string;
  duration: string;
  cost?: string;
}

export type TimelineItem = 
  | { type: 'activity'; data: ActivitySlot }
  | { type: 'transit'; data: TransitSlot };

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  theme: string;
  items: TimelineItem[];
}

export interface TripOverview {
  title: string;
  destination: string;
  durationDays: number;
  totalBudget: number;
  allocatedBudget: number;
  currency: string;
  summary: string;
  tags: string[];
}

export interface TripPage {
  id: string;
  tripOverview: TripOverview;
  itineraryDays: ItineraryDay[];
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export type ExpenseCategory = 'Accommodation' | 'Dining' | 'Groceries' | 'Transit' | 'Flights' | 'Experience' | 'Activities' | 'Shopping' | 'Errand' | 'Insurance' | 'Visa' | 'Health' | 'Communication' | 'Other';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  status: 'Pre-paid' | 'Confirmed' | 'Estimated';
}

export interface UserProfile {
  name: string;
  email?: string;
  phoneNumber?: string;
  homeCity?: string;
  countryOfResidence?: string;
  preferredCurrency?: string;
  timezone?: string;
  roleTitle: string;
  avatarUrl: string;
  tags: string[];
  stats: {
    countriesVisited: number;
    totalTrips: number;
    memberSince: number;
  };
}

export interface PastTrip {
  id: string;
  title: string;
  datesOrYear: string;
  duration: string;
  focus: string;
  imageUrl: string;
  status: 'Completed' | 'Upcoming';
}

export interface DiscoveredPlace {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  neighborhood: string;
  description: string;
  imageUrl: string;
  matchScore: number;
  matchReasons: string[];
  estimatedCostINR?: number;
  destination?: string;
  lat?: number;
  lon?: number;
  mapsUrl?: string;
}

// Spec.md Task & Quote definitions for Local Errands & Concierge Services
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
  | 'CANCELLED';

export interface VendorQuote {
  id: string;
  vendorName: string;
  channel: 'telegram' | 'whatsapp' | 'voice';
  service: string;
  lineItems: { label: string; qty: number; unitPrice: number }[];
  pickupFee: number;
  dropFee: number;
  total: number;
  currency: string;
  turnaroundHours: number;
  rating: number;
  distanceKm: number;
  pickupSlot: string;
  status: 'proposed' | 'countered' | 'accepted_by_vendor' | 'approved_by_user';
}

export interface GroundingSource {
  title?: string;
  uri: string;
  type: 'maps' | 'web';
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  sources?: GroundingSource[];
  suggestedActions?: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
}
