import mongoose from 'mongoose';
import { config } from './env';

// CRITICAL: fail fast, don't hang if MongoDB is offline in ephemeral/container environment
mongoose.set('bufferCommands', false);

export async function connectDB(): Promise<typeof mongoose | null> {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    const message = (error as Error).message.split(config.mongoUri).join('<MONGODB_URI>');
    console.error(`[Database] MongoDB connection failed: ${message}`);
    console.error('[Database] Check that MONGODB_URI is valid, the database is reachable, and the client IP is allowed.');
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] MongoDB disconnected');
    }
  } catch (error) {
    console.error(`[Database] Error disconnecting MongoDB: ${(error as Error).message}`);
  }
}
