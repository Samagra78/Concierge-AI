import Agenda from 'agenda';
import { config } from '../config/env';

let agendaInstance: Agenda | null = null;

export function getAgenda(): Agenda {
  if (!agendaInstance) {
    agendaInstance = new Agenda({
      db: { address: config.mongoUri, collection: 'jobs' },
      maxConcurrency: 10,
      defaultLockLifetime: 10000,
    });

    // Prevent unhandled error events if MongoDB is unavailable
    agendaInstance.on('error', (err) => {
      console.warn(`[Agenda] Database connection notice: ${(err as Error).message}`);
    });

    // Define background job handlers
    agendaInstance.define('vendor_followup', async (job: any) => {
      const { conversationId, taskId } = job.attrs.data || {};
      console.log(`[Agenda] Executing vendor_followup for task ${taskId}, conversation ${conversationId}`);
    });

    agendaInstance.define('approval_timeout', async (job: any) => {
      const { approvalId, taskId } = job.attrs.data || {};
      console.log(`[Agenda] Checking approval timeout for approval ${approvalId}, task ${taskId}`);
    });
  }

  return agendaInstance;
}

export async function startAgenda(): Promise<void> {
  try {
    const agenda = getAgenda();
    await agenda.start();
    console.log('[Agenda] Scheduler started successfully');
  } catch (error) {
    console.warn(`[Agenda] Failed to start agenda scheduler: ${(error as Error).message}`);
  }
}

export async function stopAgenda(): Promise<void> {
  try {
    if (agendaInstance) {
      await agendaInstance.stop();
      console.log('[Agenda] Scheduler stopped');
    }
  } catch (error) {
    console.warn(`[Agenda] Error stopping agenda: ${(error as Error).message}`);
  }
}
