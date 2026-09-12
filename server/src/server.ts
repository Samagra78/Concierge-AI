import { createApp } from './app';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { startAgenda, stopAgenda } from './services/agenda.service';

const app = createApp();

const server = app.listen(config.port, '0.0.0.0', async () => {
  console.log(`========================================================`);
  console.log(` Concierge Agent Backend running on http://0.0.0.0:${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health check: http://0.0.0.0:${config.port}/health`);
  console.log(`========================================================`);

  // Attempt database connection
  try {
    const database = await connectDB();
    // Agenda opens its own MongoDB connection; don't start it when Mongo has
    // already failed, or the rejected SRV lookup can crash the whole process.
    if (database) await startAgenda();
  } catch (error) {
    console.warn(`[Server] Continuing startup in offline/disconnected DB mode.`);
  }
});

// Graceful shutdown handling
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await stopAgenda();
    await disconnectDB();
    console.log('[Server] Process terminated cleanly.');
    process.exit(0);
  });

  // Force exit after 10s if hanging
  setTimeout(() => {
    console.error('[Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
