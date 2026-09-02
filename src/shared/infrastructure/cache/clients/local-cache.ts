import { LRUCache } from 'lru-cache';

import { envs } from '@/app/config';

/** In-process LRU cache sitting in front of Redis. */
const localCache = new LRUCache({
  max: envs.LOCAL_CACHE_MAX_ITEMS || 100,
  ttl: envs.LOCAL_CACHE_TTL || 12000,
});

export default localCache;
