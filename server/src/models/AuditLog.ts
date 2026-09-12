import { Schema, model, Document, Types } from 'mongoose';
import { AuditActor } from '@concierge/shared';

export interface IAuditLogDocument extends Document {
  taskId?: Types.ObjectId;
  actor: AuditActor;
  action: string;
  payload?: Record<string, unknown>;
  ts: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    actor: {
      type: String,
      enum: [
        'system',
        'user',
        'concierge_agent',
        'discovery_agent',
        'negotiator_agent',
        'booking_agent',
        'guardrail',
      ],
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    ts: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: false }
);

export const AuditLog = model<IAuditLogDocument>('AuditLog', auditLogSchema);
