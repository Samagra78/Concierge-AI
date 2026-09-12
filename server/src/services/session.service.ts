import {
  BaseSessionService,
  CreateSessionRequest,
  GetSessionRequest,
  AppendEventRequest,
  ListSessionsRequest,
  ListSessionsResponse,
  DeleteSessionRequest,
  Session,
  Event,
} from '@google/adk';
import { AgentSession } from '../models/AgentSession';

/**
 * MongoSessionService (Spec.md Section 4.1)
 * Persistent session storage backed by MongoDB AgentSession model
 * matching Google ADK's BaseSessionService interface.
 */
export class MongoSessionService extends BaseSessionService {
  async createSession(request: CreateSessionRequest): Promise<Session> {
    const sessionId = request.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const existing = await AgentSession.findOne({ sessionId });

    if (existing) {
      return {
        id: existing.sessionId,
        appName: request.appName,
        userId: request.userId,
        state: existing.state || {},
        events: (existing.history as any) || [],
        lastUpdateTime: existing.updatedAt ? new Date(existing.updatedAt).getTime() : Date.now(),
      };
    }

    const created = await AgentSession.create({
      sessionId,
      agent: request.appName,
      state: request.state || {},
      history: [],
    });

    return {
      id: created.sessionId,
      appName: request.appName,
      userId: request.userId,
      state: created.state || {},
      events: [],
      lastUpdateTime: Date.now(),
    };
  }

  async getSession(request: GetSessionRequest): Promise<Session | undefined> {
    const sessionDoc = await AgentSession.findOne({ sessionId: request.sessionId });
    if (!sessionDoc) {
      return undefined;
    }

    return {
      id: sessionDoc.sessionId,
      appName: request.appName,
      userId: request.userId,
      state: sessionDoc.state || {},
      events: (sessionDoc.history as any) || [],
      lastUpdateTime: sessionDoc.updatedAt ? new Date(sessionDoc.updatedAt).getTime() : Date.now(),
    };
  }

  async appendEvent({ session, event }: AppendEventRequest): Promise<Event> {
    session.events.push(event);
    session.lastUpdateTime = Date.now();

    await AgentSession.findOneAndUpdate(
      { sessionId: session.id },
      {
        $push: { history: event },
        $set: { state: session.state },
      },
      { upsert: true }
    );

    return event;
  }

  async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
    const query: Record<string, any> = { agent: request.appName };
    const limit = request.limit || 50;
    const offset = request.offset || 0;

    const totalItems = await AgentSession.countDocuments(query);
    const sessionDocs = await AgentSession.find(query).skip(offset).limit(limit);

    const sessions: Session[] = sessionDocs.map((s) => ({
      id: s.sessionId,
      appName: s.agent,
      userId: request.userId || 'system',
      state: s.state || {},
      events: [],
      lastUpdateTime: s.updatedAt ? new Date(s.updatedAt).getTime() : Date.now(),
    }));

    return {
      sessions,
      page: request.page || 1,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    };
  }

  async deleteSession(request: DeleteSessionRequest): Promise<void> {
    await AgentSession.deleteOne({ sessionId: request.sessionId });
  }
}
