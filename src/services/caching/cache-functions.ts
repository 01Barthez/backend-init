import zlib from 'zlib';

import { envs } from '@/config/env/env';

import log from '../logging/logger';
import type { CacheableData } from './Interface/caching.types';
import { CacheTTL } from './Interface/caching.types';
import localCache from './clients/local-cache';
import redisClient from './clients/redis-client';

/**
 * generic function to help saving and fetch data from cache redis and lru-cache to optimize performance
 * @params cacheKey est la clé permettant de stocker une données dans le cache
 * @params fetchFn la fonction a executer si les données ne sont pans dans le cache
 * @params ttl pour la confiuration du temps normal d'expiration d'une data dans redis
 * @returns Données récupérées depuis le cache ou après exécution de `fetchFn`
 */

export const cacheData = async <T extends CacheableData>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.LONG,
): Promise<T> => {
  if (!cacheKey || typeof cacheKey !== 'string') throw new Error('Invalid cache key provided.');
  if (typeof fetchFn !== 'function') throw new Error('fetchFn must be a function.');
  if (!Number.isInteger(ttl) || ttl <= 0) throw new Error('TTL must be a positive integer.');

  //? Fetch data from a local cache
  const cachedDataLocal = localCache.get(cacheKey);
  if (cachedDataLocal) {
    log.info(`data fetching from localCache at the key: ${cacheKey}`);

    return cachedDataLocal as T;
  }

  try {
    // & Fetch data from redis
    const cachedDataRedis = await redisClient.get(cacheKey);

    // & check if redis has data and return it
    if (cachedDataRedis) {
      try {
        // Decompress dcachedDataRedisata if necessary
        let data: T;
        if (cachedDataRedis.startsWith('c')) {
          const decompressedData = zlib
            .inflateSync(Buffer.from(cachedDataRedis.slice(1), 'base64'))
            .toString();
          data = JSON.parse(decompressedData) as T;
        } else {
          data = JSON.parse(cachedDataRedis) as T;
        }

        if (data !== null) localCache.set(cacheKey, data); // Updating local cache

        log.info(`data fetching from redis at the key: ${cacheKey}`);
        return data;
      } catch (error) {
        log.warn(`Failed to decompress or parse Redis data: ${error} ! Fetching new data...`);
        await redisClient.del(cacheKey);
      }
    }

    // & if data are not in the cache, execute the function
    log.info('data are not in the cache, execution of the function...');
    const startTime = Date.now();

    const data = await fetchFn();

    log.info(`fetchFn executed in ${Date.now() - startTime}ms.`); //

    // & Set fetching data inside redis and localcach
    const serializedData = JSON.stringify(data);
    let dataToStore: string;

    //* Compress data only if size is greater than 1Ko
    if (Buffer.byteLength(serializedData) > envs.COMPRESSION_THRESHOLD) {
      const compressData = zlib.deflateSync(serializedData).toString('base64');
      dataToStore = `c${compressData}`; // Add c caracter for compress data
    } else {
      dataToStore = serializedData;
    }

    if (data !== null) localCache.set(cacheKey, data); // Updating local cache
    await redisClient.setex(cacheKey, ttl, dataToStore);

    log.info(
      `data fetching, saved in the cache with TTL: ${ttl} and in the localcache under the key: ${cacheKey}...`,
    );

    // & return data if all is done...
    return data;
  } catch (error) {
    const messageError = `Failed to manage cache for key: ${cacheKey}. Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`;

    log.error(messageError, { cacheKey, error });

    // Graceful degradation: return fresh data instead of failing
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

/**
 * Invalidate cache by key
 */
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

/**
 * Invalidate multiple cache keys by pattern
 */
export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);

      // Clear from local cache as well
      keys.forEach((key) => localCache.delete(key));
      log.info(`Cache invalidated for pattern: ${pattern}, ${keys.length} keys deleted`);
    }
  } catch (error) {
    log.error(`Failed to invalidate cache pattern: ${pattern}`, { error });
    throw error;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    localCache: {
      size: localCache.size,
      max: localCache.max,
    },
  };
};

/**
 * Clear all caches
 */
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
