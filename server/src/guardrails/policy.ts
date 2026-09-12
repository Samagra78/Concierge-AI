import { Quote, PolicyConfig } from '@concierge/shared';
import { config } from '../config/env';
import { Vendor } from '../models/Vendor';
import { Approval } from '../models/Approval';
import { Quote as QuoteModel } from '../models/Quote';
import { AuditLog } from '../models/AuditLog';

export class PolicyError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PolicyError';
    this.code = code;
  }
}

export const defaultPolicy: PolicyConfig = {
  maxRoundsPerVendor: config.maxNegotiationRounds,
  outboundMessagingEnabled: config.outboundMessagingEnabled,
  approvalTtlMinutes: config.approvalTtlMinutes,
  vendorsPerTask: config.vendorsPerTask,
  defaultCurrency: config.defaultCurrency,
  maxNudgesPerVendor: 3,
  minNudgeIntervalHours: 2,
};

/**
 * Checks whether outbound messaging is globally allowed and the vendor has not opted out.
 */
export async function assertCanContactVendor(vendorId: string): Promise<void> {
  if (!defaultPolicy.outboundMessagingEnabled) {
    throw new PolicyError('OUTBOUND_MESSAGING_DISABLED', 'Global kill-switch is active. Outbound messaging is paused.');
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new PolicyError('VENDOR_NOT_FOUND', `Vendor ${vendorId} not found in database.`);
  }

  if (vendor.optedOut) {
    throw new PolicyError('VENDOR_OPTED_OUT', `Vendor ${vendor.name} has opted out of messages globally.`);
  }
}

/**
 * PII Minimisation (Spec.md Section 7 & 14):
 * Full addresses and phone numbers are redacted prior to user approval.
 * Locality and pincode are permitted.
 */
export function redactPII(text: string): string {
  // Redact 10-digit Indian phone numbers
  const phonePattern = /(?:\+91|91|0)?[6-9]\d{9}/g;
  let redacted = text.replace(phonePattern, '[PHONE REDACTED]');

  // Redact specific street/flat patterns if present
  const flatPattern = /\b(?:Flat|Apartment|Apt|House|Plot|H\.No|Door)\s*#?\s*\w+[\w\s,-]*/gi;
  redacted = redacted.replace(flatPattern, '[LOCALITY ONLY]');

  return redacted;
}

/**
 * Human Approval Gate Verification (Spec.md Section 9)
 * Used by confirm_booking tool to guarantee no booking occurs without user approval.
 */
export async function verifyApprovalGate(taskId: string, quoteId: string): Promise<void> {
  const approval = await Approval.findOne({
    taskId,
    quoteId,
    status: 'granted',
    expiresAt: { $gt: new Date() },
  });

  if (!approval) {
    await AuditLog.create({
      taskId,
      actor: 'guardrail',
      action: 'policy.violation',
      payload: { code: 'NO_VALID_APPROVAL', quoteId },
    });
    throw new PolicyError('NO_VALID_APPROVAL', 'No valid, unexpired approval granted by user for this quote.');
  }

  const currentQuote = await QuoteModel.findById(quoteId);
  if (!currentQuote) {
    throw new PolicyError('QUOTE_NOT_FOUND', 'Quote referenced in approval no longer exists.');
  }

  // Verify that quote parameters haven't changed since approval was granted
  const snapshot = approval.quoteSnapshot as Quote;
  if (snapshot.total !== currentQuote.total || snapshot.currency !== currentQuote.currency) {
    await AuditLog.create({
      taskId,
      actor: 'guardrail',
      action: 'policy.violation',
      payload: { code: 'QUOTE_CHANGED_SINCE_APPROVAL', snapshotTotal: snapshot.total, currentTotal: currentQuote.total },
    });
    throw new PolicyError('QUOTE_CHANGED_SINCE_APPROVAL', 'Vendor quote terms have changed since user approval.');
  }
}
