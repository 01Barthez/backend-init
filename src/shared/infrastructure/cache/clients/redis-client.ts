import Redis from 'ioredis';

import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

/** Shared Redis client used by the cache layer (lazy connect). */
const redisClient = new Redis({
  host: envs.REDIS_HOST,
  port: envs.REDIS_PORT,
  db: 0,
  lazyConnect: true,
  connectTimeout: 10000,
  maxRetriesPerRequest: 5,
  password: envs.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (error) => {
  log.error(`[Redis] connection error at ${envs.REDIS_HOST}:${envs.REDIS_PORT}`, { error });
});

redisClient.on('connect', () => {
  log.info('[Redis] success connection to Redis');
});

redisClient.on('reconnecting', (time: number) => {
  log.warn(`[Redis] reconnexion to redis in ${time} ms ...`);
});

export default redisClient;
