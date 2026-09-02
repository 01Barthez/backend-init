/**
 * Optional cache invalidation after auth mutations that change user state.
 */
export interface UserCachePort {
  invalidate(userId: string, email?: string): Promise<void>;
}
