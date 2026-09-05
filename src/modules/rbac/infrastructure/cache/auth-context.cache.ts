/**
 * Short-lived Redis cache for RBAC auth context (permissions + roles).
 * Invalidate whenever roles or account flags that affect auth change.
 */
import { type CacheableData, cacheData, invalidateCache } from '@/shared/infrastructure/cache';

import type { UserAuthContext } from '../../domain/types/rbac.types';

const AUTH_CONTEXT_TTL_SECONDS = 45;

const authContextKey = (userId: string): string => `auth:ctx:${userId}`;

export async function getCachedUserAuthContext(
  userId: string,
  factory: () => Promise<UserAuthContext>,
): Promise<UserAuthContext> {
  return cacheData(
    authContextKey(userId),
    factory as () => Promise<CacheableData>,
    AUTH_CONTEXT_TTL_SECONDS,
  ) as Promise<UserAuthContext>;
}

export async function invalidateAuthContext(userId: string): Promise<void> {
  await invalidateCache(authContextKey(userId));
}
