import { cacheData, invalidateCache, invalidateCachePattern } from '@/shared/infrastructure/cache';
import type { CacheableData } from '@/shared/infrastructure/cache/interfaces/cache.types';

import type { BlogCachePort } from '../../application/services/blog-cache.port';
import type { BlogRbacPort } from '../../application/services/rbac.port';

/**
 * Default adapters bridging shared cache + legacy RBAC into blog ports.
 */

export const createBlogCacheAdapter = (): BlogCachePort => ({
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T> {
    return cacheData(key, factory as () => Promise<CacheableData>, ttlSeconds) as Promise<T>;
  },
  async invalidate(key: string): Promise<void> {
    await invalidateCache(key);
  },
  async invalidatePattern(pattern: string): Promise<void> {
    await invalidateCachePattern(pattern);
  },
});

export const createBlogRbacAdapter = (): BlogRbacPort => ({
  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const { rbacService } = await import('@/modules/rbac');
    return rbacService.hasAnyRole(userId, roles);
  },
});
