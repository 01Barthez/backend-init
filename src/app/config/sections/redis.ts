/**
 * Redis / cache connection settings.
 * Used by the cache adapter, rate-limit store, locks, and BullMQ.
 */
import { fromEnv } from '../env';

export const redisConfig = {
  host: fromEnv.get('REDIS_HOST').required().asString(),
  port: fromEnv.get('REDIS_PORT').required().asPortNumber(),
  username: fromEnv.get('REDIS_USERNAME').default('').asString(),
  password: fromEnv.get('REDIS_PASSWORD').default('').asString(),
  /** Enable TLS for ElastiCache / Memorystore in transit. */
  tls: fromEnv.get('REDIS_TLS').default('false').asBool(),
  tlsRejectUnauthorized: fromEnv.get('REDIS_TLS_REJECT_UNAUTHORIZED').default('true').asBool(),
  db: fromEnv.get('REDIS_DB').default(0).asInt(),

  localCache: {
    maxItems: fromEnv.get('LOCAL_CACHE_MAX_ITEMS').default(100).asInt(),
    ttlMs: fromEnv.get('LOCAL_CACHE_TTL').default(12000).asInt(),
  },

  compressionThreshold: fromEnv.get('COMPRESSION_THRESHOLD').default(1024).asInt(),
} as const;

export type RedisConfig = typeof redisConfig;
