import mongoose from 'mongoose';
import { env } from './env';

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize:         10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS:     45000,
};

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected',    () => console.log('✅ MongoDB connected'));
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
  mongoose.connection.on('error',        (err) => console.error('❌ MongoDB error:', err));

  await mongoose.connect(env.MONGODB_URI, MONGOOSE_OPTIONS);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
