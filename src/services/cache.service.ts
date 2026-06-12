import { redis } from './redis.js';

const TTL = 60; // seconds

export const cacheGet = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

export const cacheSet = async (key: string, value: unknown): Promise<void> => {
  await redis.set(key, JSON.stringify(value), 'EX', TTL);
};

export const cacheDelete = async (...keys: string[]): Promise<void> => {
  if (keys.length) await redis.del(...keys);
};