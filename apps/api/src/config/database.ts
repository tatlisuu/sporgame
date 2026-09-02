import mongoose from 'mongoose';
import { env } from './env';

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let lastError: string | null = null;

export function getDatabaseStatus(): { status: string; error: string | null } {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    error: lastError,
  };
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => {
    lastError = null;
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
  mongoose.connection.on('error', (err) => {
    lastError = err.message;
    console.error('❌ MongoDB error:', err);
  });

  try {
    await mongoose.connect(env.MONGODB_URI, MONGOOSE_OPTIONS);
  } catch (err: any) {
    lastError = err.message;
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
