import Redis from 'ioredis';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

// Create instance of redis
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

// Handle error — log only; throwing here crashes the process on transient outages
redisClient.on('error', (error) => {
  log.error(`[Redis] connection error at ${envs.REDIS_HOST}:${envs.REDIS_PORT}`, { error });
});

// success connection
redisClient.on('connect', () => {
  log.info('[Redis] success connection to Redis');
});

// Status for reconnection to redis
redisClient.on('reconnecting', (time: number) => {
  log.warn(`[Redis] reconnexion to redis in ${time} ms ...`);
});

export default redisClient;
