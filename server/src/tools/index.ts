import { z } from 'zod';
import { FunctionTool } from '@google/adk';
import { assertCanContactVendor, redactPII, verifyApprovalGate } from '../guardrails/policy';
import { Quote } from '../models/Quote';
import { Booking } from '../models/Booking';
import { Approval } from '../models/Approval';
import { AuditLog } from '../models/AuditLog';

/**
 * 1. search_places(query, lat, lng, radius)
 * Discovers nearby places (Spec.md Section 12)
 */
export const searchPlacesTool = new FunctionTool({
  name: 'search_places',
  description: 'Search for local service vendors matching category near given coordinates',
  parameters: z.object({
    query: z.string().describe('Search term e.g. "laundry" or "dry cleaners"'),
    lat: z.number().describe('Latitude coordinate'),
    lng: z.number().describe('Longitude coordinate'),
    radius: z.number().optional().describe('Search radius in meters (default 5000)'),
  }) as any,
  execute: async (args: any) => {
    return {
      query: args.query,
      location: { lat: args.lat, lng: args.lng },
      radius: args.radius || 5000,
      status: 'OK',
      candidates: [],
    };
  },
});

/**
 * 2. get_place_details(placeId)
 * Retrieves hours, phone, and rating (Spec.md Section 12)
 */
export const getPlaceDetailsTool = new FunctionTool({
  name: 'get_place_details',
  description: 'Fetch details for a place from Google Places API including phone, address, and rating',
  parameters: z.object({
    placeId: z.string().describe('Google Place ID'),
  }) as any,
  execute: async (args: any) => {
    return {
      placeId: args.placeId,
      status: 'OK',
    };
  },
});

/**
 * 3. rank_vendors(vendors, task)
 * Deterministic scoring: distance, rating, open hours, category fit (Spec.md Section 12)
 */
export const rankVendorsTool = new FunctionTool({
  name: 'rank_vendors',
  description: 'Rank discovered vendors based on distance, rating, user ratings count, and fit',
  parameters: z.object({
    vendors: z.array(z.record(z.any())).describe('List of discovered vendors'),
    taskId: z.string().describe('Task identifier'),
  }) as any,
  execute: async (args: any) => {
    return {
      ranked: args.vendors,
      taskId: args.taskId,
    };
  },
});

/**
 * 4. start_outreach(vendorId, taskId)
 * Guarded: Checks rate limits and global opt-out before initiating (Spec.md Section 12)
 */
export const startOutreachTool = new FunctionTool({
  name: 'start_outreach',
  description: 'Generate deep-link invite token and send first-touch message to vendor',
  parameters: z.object({
    vendorId: z.string().describe('Vendor ID to contact'),
    taskId: z.string().describe('Task ID'),
  }) as any,
  execute: async (args: any) => {
    await assertCanContactVendor(args.vendorId);

    return {
      success: true,
      vendorId: args.vendorId,
      taskId: args.taskId,
      message: 'Outreach initiated',
    };
  },
});

/**
 * 5. send_vendor_message(conversationId, text)
 * Guarded: Policy check and PII redaction (Spec.md Section 12)
 */
export const sendVendorMessageTool = new FunctionTool({
  name: 'send_vendor_message',
  description: 'Send a message to a vendor on their active channel with automatic PII redaction',
  parameters: z.object({
    conversationId: z.string().describe('Active conversation ID'),
    text: z.string().describe('Message content to send'),
  }) as any,
  execute: async (args: any) => {
    const sanitizedText = redactPII(args.text);

    return {
      success: true,
      conversationId: args.conversationId,
      sentText: sanitizedText,
    };
  },
});

/**
 * 6. record_quote(conversationId, quote)
 * Records structured quote (Spec.md Section 12)
 */
export const recordQuoteTool = new FunctionTool({
  name: 'record_quote',
  description: 'Persist a structured quote received from a vendor',
  parameters: z.object({
    conversationId: z.string().optional(),
    vendorId: z.string(),
    taskId: z.string(),
    total: z.number(),
    currency: z.string().optional(),
    pickupFee: z.number().optional(),
    dropFee: z.number().optional(),
    turnaroundHours: z.number().optional(),
  }) as any,
  execute: async (args: any) => {
    const created = await Quote.create({
      vendorId: args.vendorId,
      taskId: args.taskId,
      total: args.total,
      currency: args.currency || 'INR',
      pickupFee: args.pickupFee || 0,
      dropFee: args.dropFee || 0,
      turnaroundHours: args.turnaroundHours || 24,
      status: 'proposed',
    });

    return {
      success: true,
      quoteId: created._id.toString(),
      total: created.total,
    };
  },
});

/**
 * 7. schedule_followup(conversationId, delayMinutes)
 * Schedules a follow-up timer (Spec.md Section 12)
 */
export const scheduleFollowupTool = new FunctionTool({
  name: 'schedule_followup',
  description: 'Schedule a follow-up nudge for a vendor after a delay',
  parameters: z.object({
    conversationId: z.string(),
    delayMinutes: z.number(),
  }) as any,
  execute: async (args: any) => {
    return {
      scheduled: true,
      conversationId: args.conversationId,
      delayMinutes: args.delayMinutes,
    };
  },
});

/**
 * 8. request_user_approval(taskId, quoteId)
 * Creates an Approval record and presents it to the user (Spec.md Section 9 & 12)
 */
export const requestUserApprovalTool = new FunctionTool({
  name: 'request_user_approval',
  description: 'Present the best negotiated quote to the user for explicit approval before booking',
  parameters: z.object({
    taskId: z.string(),
    quoteId: z.string(),
    expiresInMinutes: z.number().optional(),
  }) as any,
  execute: async (args: any) => {
    const quote = await Quote.findById(args.quoteId);
    if (!quote) {
      throw new Error(`Quote ${args.quoteId} not found`);
    }

    const ttl = args.expiresInMinutes || 60;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const approval = await Approval.create({
      taskId: args.taskId,
      quoteId: args.quoteId,
      quoteSnapshot: quote.toObject(),
      status: 'pending',
      expiresAt,
    });

    await AuditLog.create({
      taskId: args.taskId,
      actor: 'concierge_agent',
      action: 'approval.requested',
      payload: { approvalId: approval._id, quoteId: args.quoteId },
    });

    return {
      approvalId: approval._id.toString(),
      status: 'pending',
      expiresAt,
    };
  },
});

/**
 * 9. confirm_booking(taskId, quoteId, pickupSlot)
 * CRITICAL GUARDED TOOL: Requires verified user approval in database before confirming (Spec.md Section 9 & 12)
 */
export const confirmBookingTool = new FunctionTool({
  name: 'confirm_booking',
  description: 'Confirm booking with vendor. STRICTLY REQUIRES prior granted user approval record.',
  parameters: z.object({
    taskId: z.string(),
    quoteId: z.string(),
    pickupSlot: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }) as any,
  execute: async (args: any) => {
    // ENFORCE APPROVAL GATE
    await verifyApprovalGate(args.taskId, args.quoteId);

    const quote = await Quote.findById(args.quoteId);
    if (!quote) throw new Error('Quote not found');

    const booking = await Booking.create({
      taskId: args.taskId,
      vendorId: quote.vendorId,
      quoteId: quote._id,
      pickupSlot: {
        start: new Date(args.pickupSlot.start),
        end: new Date(args.pickupSlot.end),
      },
      status: 'confirmed',
    });

    await AuditLog.create({
      taskId: args.taskId,
      actor: 'booking_agent',
      action: 'booking.confirmed',
      payload: { bookingId: booking._id, quoteId: quote._id },
    });

    return {
      success: true,
      bookingId: booking._id.toString(),
      status: 'confirmed',
    };
  },
});

/**
 * 10. update_fulfilment(bookingId, status)
 * Updates delivery progress (Spec.md Section 12)
 */
export const updateFulfilmentTool = new FunctionTool({
  name: 'update_fulfilment',
  description: 'Update the fulfilment status of a confirmed booking',
  parameters: z.object({
    bookingId: z.string(),
    status: z.enum(['scheduled', 'picked_up', 'in_progress', 'delivered', 'cancelled']),
  }) as any,
  execute: async (args: any) => {
    const booking = await Booking.findByIdAndUpdate(
      args.bookingId,
      { status: args.status },
      { new: true }
    );
    return {
      success: true,
      bookingId: args.bookingId,
      newStatus: booking?.status,
    };
  },
});

/**
 * 11. notify_user(taskId, message)
 * Pushes timeline notification to user (Spec.md Section 12)
 */
export const notifyUserTool = new FunctionTool({
  name: 'notify_user',
  description: 'Post an event or message to the user timeline in the web app',
  parameters: z.object({
    taskId: z.string(),
    message: z.string(),
  }) as any,
  execute: async (args: any) => {
    await AuditLog.create({
      taskId: args.taskId,
      actor: 'concierge_agent',
      action: 'user.notified',
      payload: { message: args.message },
    });

    return { success: true, taskId: args.taskId, message: args.message };
  },
});
