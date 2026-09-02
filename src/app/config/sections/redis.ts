/**
 * Redis / cache connection settings.
 * Used by the shared cache adapter and BullMQ workers.
 */
import { fromEnv } from '../env';

export const redisConfig = {
  host: fromEnv.get('REDIS_HOST').required().asString(),
  port: fromEnv.get('REDIS_PORT').required().asPortNumber(),
  username: fromEnv.get('REDIS_USERNAME').default('').asString(),
  password: fromEnv.get('REDIS_PASSWORD').default('').asString(),

  localCache: {
    maxItems: fromEnv.get('LOCAL_CACHE_MAX_ITEMS').default(100).asInt(),
    ttlMs: fromEnv.get('LOCAL_CACHE_TTL').default(12000).asInt(),
  },

  compressionThreshold: fromEnv.get('COMPRESSION_THRESHOLD').default(1024).asInt(),
} as const;

export type RedisConfig = typeof redisConfig;
