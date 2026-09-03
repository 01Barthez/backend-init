import type { RedisOptions } from 'ioredis';

import { config } from '@/app/config';

/**
 * Single Redis option builder for cache, locks, rate-limit, and BullMQ.
 */
export const buildRedisOptions = (overrides: Partial<RedisOptions> = {}): RedisOptions => {
  const options: RedisOptions = {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
    username: config.redis.username || undefined,
    password: config.redis.password || undefined,
    connectTimeout: 10_000,
    maxRetriesPerRequest: 5,
    ...overrides,
  };

  if (config.redis.tls) {
    options.tls = {
      rejectUnauthorized: config.redis.tlsRejectUnauthorized,
    };
  }

  return options;
};
