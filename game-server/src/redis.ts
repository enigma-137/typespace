import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn("REDIS_URL is not defined in .env! Redis features will be disabled.");
}

export const redisClient = REDIS_URL ? createClient({ url: REDIS_URL }) : null;

if (redisClient) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  
  // We don't await connect() here because it's top-level, 
  // but we can ensure it connects when the server starts in index.ts
}

export const connectRedis = async () => {
  if (redisClient && !redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis Client Connected");
  }
};
