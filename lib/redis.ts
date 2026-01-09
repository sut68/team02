// lib/redis.ts
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}

export async function setCache(key: string, value: string, ttl = 60) {
  await connectRedis();
  await redisClient.set(key, value, { EX: ttl });
}

export async function getCache(key: string) {
  await connectRedis();
  return await redisClient.get(key);
}
