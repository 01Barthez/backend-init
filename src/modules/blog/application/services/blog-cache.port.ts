/**
 * Optional cache port for public blog list / slug lookups.
 * Omit in tests to bypass caching.
 */
export interface BlogCachePort {
  getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number): Promise<T>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}
