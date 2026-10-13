import mongoose from 'mongoose';

let connectionPromise;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGODB_URI
    || (process.env.VERCEL ? '' : 'mongodb://127.0.0.1:27017/apex-shift');
  if (!uri) throw new Error('MONGODB_URI must be configured for database access.');

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;
}