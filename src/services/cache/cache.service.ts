import zlib from 'zlib';

import { envs } from '@/config/env/env';
import log from '@/services/logging/logger';

import localCache from './clients/local-cache';
import redisClient from './clients/redis-client';
import type { CacheableData } from './interfaces/cache.types';
import { CacheTTL } from './interfaces/cache.types';

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
    log.info(`data fetching from localCache at the key: ${cacheKey}`);
    return cachedDataLocal as T;
  }

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
        log.info(`data fetching from redis at the key: ${cacheKey}`);
        return data;
      } catch (error) {
        log.warn(`Failed to decompress or parse Redis data: ${error} ! Fetching new data...`);
        await redisClient.del(cacheKey);
      }
    }

    log.info('data are not in the cache, execution of the function...');
    const startTime = Date.now();
    const data = await fetchFn();
    log.info(`fetchFn executed in ${Date.now() - startTime}ms.`);

    const serializedData = JSON.stringify(data);
    let dataToStore: string;

    if (Buffer.byteLength(serializedData) > envs.COMPRESSION_THRESHOLD) {
      const compressData = zlib.deflateSync(serializedData).toString('base64');
      dataToStore = `c${compressData}`;
    } else {
      dataToStore = serializedData;
    }

    if (data !== null) localCache.set(cacheKey, data);
    await redisClient.setex(cacheKey, ttl, dataToStore);

    log.info(
      `data fetching, saved in the cache with TTL: ${ttl} and in the localcache under the key: ${cacheKey}...`,
    );

    return data;
  } catch (error) {
    const messageError = `Failed to manage cache for key: ${cacheKey}. Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    log.error(messageError, { cacheKey, error });

    try {
      log.warn(`Attempting to fetch fresh data after cache error for key: ${cacheKey}`);
      return await fetchFn();
    } catch (fetchError) {
      const fetchErrorMsg = `Critical: Failed to fetch data after cache error for key: ${cacheKey}`;
      log.error(fetchErrorMsg, { cacheKey, error: fetchError });
      throw new Error(fetchErrorMsg);
    }
  }
};

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

export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      keys.forEach((key) => localCache.delete(key));
      log.info(`Cache invalidated for pattern: ${pattern}, ${keys.length} keys deleted`);
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
