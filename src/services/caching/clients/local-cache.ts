import { LRUCache } from 'lru-cache';

import { envs } from '@/config/env/env';

// setup a local cache
const localCache = new LRUCache({
  max: envs.LOCAL_CACHE_MAX_ITEMS || 100,
  ttl: envs.LOCAL_CACHE_TTL || 12000, // 2 minutes
});

export default localCache;
