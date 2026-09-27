import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is required to start the API.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.info('MongoDB connected.');
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
