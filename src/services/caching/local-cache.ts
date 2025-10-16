import { LRUCache } from 'lru-cache';

import { envs } from '@/config/env/env';

// setup a local cache
const localCache = new LRUCache({
  max: envs.LOCAL_CACHE_MAX_ITEMS || 100,
  ttl: 60 * 1000 * 2, // 2 minutes
});

export default localCache;
