import { LlmAgent } from '@google/adk';
import { config } from '../config/env';
import {
  searchPlacesTool,
  getPlaceDetailsTool,
  rankVendorsTool,
  startOutreachTool,
  sendVendorMessageTool,
  recordQuoteTool,
  scheduleFollowupTool,
  requestUserApprovalTool,
  confirmBookingTool,
  updateFulfilmentTool,
  notifyUserTool,
} from '../tools';

export const discoveryAgent = new LlmAgent({
  name: 'discovery_agent',
  description: 'Specialist agent that searches and ranks nearby local service vendors via Google Places',
  instruction: `You are the Discovery Agent for the Concierge system.
Your job is to search for nearby local vendors (laundry, ironing, dry cleaning, repairs)
and rank them objectively by distance, rating, review count, and service fit.`,
  tools: [searchPlacesTool, getPlaceDetailsTool, rankVendorsTool],
});

export const negotiatorAgent = new LlmAgent({
  name: 'negotiator_agent',
  description: 'Specialist agent that interacts with a specific vendor on Telegram/WhatsApp to negotiate quotes',
  instruction: `You are the Negotiator Agent acting politely on behalf of a customer.
Always state that you are an AI assistant representing a customer.
Negotiate fairly within limits: max 3 rounds, never invent facts, never agree to advance payment,
and never share customer full address or phone number prior to approval.`,
  tools: [sendVendorMessageTool, recordQuoteTool, scheduleFollowupTool],
});

export const bookingAgent = new LlmAgent({
  name: 'booking_agent',
  description: 'Specialist agent that confirms booking with vendor after user approval and monitors fulfilment',
  instruction: `You are the Booking and Fulfilment Agent.
CRITICAL RULE: You may NEVER confirm a booking without an explicit, granted user approval record.
Enforce the approval gate at all times. Once confirmed, share pickup details with the vendor and track progress.`,
  tools: [confirmBookingTool, updateFulfilmentTool],
});

export const conciergeRootAgent = new LlmAgent({
  name: 'concierge_root_agent',
  description: 'Root Concierge Agent managing customer errands, clarifications, and agent delegation',
  instruction: `You are Concierge, a helpful personal assistant for local errands (laundry, ironing, dry cleaning, repairs).
1. Clarify customer requirements (items, pickup window, budget, locality).
2. Delegate discovery to the Discovery Agent.
3. Compare quotes received from the Negotiator Agents.
4. Present the best option to the user for explicit approval.
5. NEVER commit to a price or finalize a booking on your own. User approval is mandatory.`,
  tools: [requestUserApprovalTool, notifyUserTool, startOutreachTool],
  subAgents: [discoveryAgent, negotiatorAgent, bookingAgent],
});

export function getConciergeAgent(): LlmAgent {
  return conciergeRootAgent;
}
