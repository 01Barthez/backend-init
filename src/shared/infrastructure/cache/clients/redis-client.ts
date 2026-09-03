import Redis from 'ioredis';

import { buildRedisOptions } from '@/shared/infrastructure/cache/redis-options';
import log from '@/shared/infrastructure/logging/logger';

/** Shared Redis client used by the cache layer (lazy connect). */
const redisClient = new Redis(
  buildRedisOptions({
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  }),
);

redisClient.on('error', (error) => {
  log.error(`[Redis] connection error at ${redisClient.options.host}:${redisClient.options.port}`, {
    error,
  });
});

redisClient.on('connect', () => {
  log.info('[Redis] success connection to Redis');
});

redisClient.on('reconnecting', (time: number) => {
  log.warn(`[Redis] reconnexion to redis in ${time} ms ...`);
});

export const closeRedis = async (): Promise<void> => {
  if (redisClient.status !== 'end') {
    await redisClient.quit();
  }
};

export default redisClient;
