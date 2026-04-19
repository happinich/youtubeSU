import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedis(): Redis | null {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) return null;
  return new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
}

export const redis = globalForRedis.redis ?? createRedis();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export async function getCachedSummary(videoId: string) {
  if (!redis) return null;
  return redis.get<string>(`summary:${videoId}`);
}

export async function setCachedSummary(videoId: string, noteId: string) {
  if (!redis) return;
  await redis.set(`summary:${videoId}`, noteId, { ex: 60 * 60 * 24 * 7 });
}
