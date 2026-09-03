/**
 * Cache infrastructure public API.
 * Prefer these helpers over importing Redis clients from modules.
 */
export type { CachePort } from './cache.port';
export {
  cacheData,
  clearAllCache,
  getCacheStats,
  invalidateCache,
  invalidateCachePattern,
} from './cache.service';
export { default as localCache } from './clients/local-cache';
export { closeRedis, default as redisClient } from './clients/redis-client';
export type { CacheableData } from './interfaces/cache.types';
export { CacheTTL } from './interfaces/cache.types';
