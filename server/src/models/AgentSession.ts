import { Schema, model, Document, Types } from 'mongoose';

export interface IAgentSessionDocument extends Document {
  sessionId: string;
  taskId?: Types.ObjectId;
  agent: string;
  state: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const agentSessionSchema = new Schema<IAgentSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    agent: { type: String, required: true },
    state: { type: Schema.Types.Mixed, default: {} },
    history: { type: [Schema.Types.Mixed], default: [] } as any,
  },
  { timestamps: true }
);

export const AgentSession = model<IAgentSessionDocument>('AgentSession', agentSessionSchema);
