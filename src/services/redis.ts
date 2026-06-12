import { Redis } from 'ioredis';   // named import, not default
import { environment } from '../environment.js';

export const redis = new Redis(environment.REDIS_URL);

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err: Error) => console.error('Redis error:', err));  // type the err