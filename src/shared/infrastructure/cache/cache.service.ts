/**
 * Multi-tier cache: process-local LRU → Redis, with optional zlib compression
 * for large payloads. Prefer `cacheData` / invalidation helpers over talking
 * to Redis directly from application code.
 */
import zlib from 'zlib';

import { envs } from '@/app/config';
import { isAppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import localCache from './clients/local-cache';
import redisClient from './clients/redis-client';
import type { CacheableData } from './interfaces/cache.types';
import { CacheTTL } from './interfaces/cache.types';

export { CacheTTL };
export type { CacheableData };
export type { CachePort } from './cache.port';

/**
 * Read-through cache helper.
 * Returns local → Redis hit when present; otherwise runs `fetchFn` and stores the result.
 *
 * Domain / application errors from `fetchFn` (e.g. AppError 404) are rethrown as-is.
 * Only Redis / serialization failures trigger the fallback fetch path.
 */
export const cacheData = async <T extends CacheableData>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.LONG,
): Promise<T> => {
  if (!cacheKey || typeof cacheKey !== 'string') throw new Error('Invalid cache key provided.');
  if (typeof fetchFn !== 'function') throw new Error('fetchFn must be a function.');
  if (!Number.isInteger(ttl) || ttl <= 0) throw new Error('TTL must be a positive integer.');

  const cachedDataLocal = localCache.get(cacheKey);
  if (cachedDataLocal) {
    log.debug(`data fetching from localCache at the key: ${cacheKey}`);
    return cachedDataLocal as T;
  }

  let redisReadFailed = false;

  try {
    const cachedDataRedis = await redisClient.get(cacheKey);

    if (cachedDataRedis) {
      try {
        let data: T;
        if (cachedDataRedis.startsWith('c')) {
          const decompressedData = zlib
            .inflateSync(Buffer.from(cachedDataRedis.slice(1), 'base64'))
            .toString();
          data = JSON.parse(decompressedData) as T;
        } else {
          data = JSON.parse(cachedDataRedis) as T;
        }

        if (data !== null) localCache.set(cacheKey, data);
        log.debug(`data fetching from redis at the key: ${cacheKey}`);
        return data;
      } catch (error) {
        log.warn(`Failed to decompress or parse Redis data: ${error} ! Fetching new data...`);
        await redisClient.del(cacheKey);
      }
    }
  } catch (error) {
    redisReadFailed = true;
    log.error(`Failed to read cache for key: ${cacheKey}`, { cacheKey, error });
  }

  try {
    log.debug('data are not in the cache, execution of the function...');
    const startTime = Date.now();
    const data = await fetchFn();
    log.debug(`fetchFn executed in ${Date.now() - startTime}ms.`);

    const serializedData = JSON.stringify(data);
    let dataToStore: string;

    if (Buffer.byteLength(serializedData) > envs.COMPRESSION_THRESHOLD) {
      const compressData = zlib.deflateSync(serializedData).toString('base64');
      dataToStore = `c${compressData}`;
    } else {
      dataToStore = serializedData;
    }

    if (data !== null) localCache.set(cacheKey, data);

    try {
      await redisClient.setex(cacheKey, ttl, dataToStore);
      log.debug(
        `data fetching, saved in the cache with TTL: ${ttl} and in the localcache under the key: ${cacheKey}...`,
      );
    } catch (error) {
      log.warn(`Failed to write cache for key: ${cacheKey}`, { cacheKey, error });
    }

    return data;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    if (redisReadFailed) {
      const fetchErrorMsg = `Critical: Failed to fetch data after cache error for key: ${cacheKey}`;
      log.error(fetchErrorMsg, { cacheKey, error });
      throw new Error(fetchErrorMsg);
    }

    throw error;
  }
};

/** Drop a single key from both local and Redis caches. */
export const invalidateCache = async (cacheKey: string): Promise<void> => {
  try {
    localCache.delete(cacheKey);
    await redisClient.del(cacheKey);
    log.info(`Cache invalidated for key: ${cacheKey}`);
  } catch (error) {
    log.error(`Failed to invalidate cache for key: ${cacheKey}`, { error });
    throw error;
  }
};

/** Drop all keys matching a Redis pattern via SCAN (never KEYS in production). */
export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    let cursor = '0';
    let deleted = 0;

    do {
      // Sequential SCAN pages — parallelizing would race the cursor.
      // eslint-disable-next-line no-await-in-loop -- intentional cursor iteration
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        // eslint-disable-next-line no-await-in-loop -- delete each SCAN page before next
        await redisClient.del(...keys);
        for (const key of keys) {
          localCache.delete(key);
        }
        deleted += keys.length;
      }
    } while (cursor !== '0');

    if (deleted > 0) {
      log.debug(`Cache invalidated for pattern: ${pattern}, ${deleted} keys deleted`);
    }
  } catch (error) {
    log.error(`Failed to invalidate cache pattern: ${pattern}`, { error });
    throw error;
  }
};

export const getCacheStats = () => ({
  localCache: {
    size: localCache.size,
    max: localCache.max,
  },
});

export const clearAllCache = async (): Promise<void> => {
  try {
    localCache.clear();
    await redisClient.flushdb();
    log.warn('All caches cleared');
  } catch (error) {
    log.error('Failed to clear all caches', { error });
    throw error;
  }
};
