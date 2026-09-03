import {
  CacheTTL,
  cacheData,
  invalidateCache,
  invalidateCachePattern,
} from '@/shared/infrastructure/cache';
import log from '@/shared/infrastructure/logging/logger';

import type { UserCachePort } from '../../application/services/user-cache.port';
import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserListFilters, UserListResult } from '../../domain/types/users.types';
import { UserCacheKeys } from '../cache/user-cache.keys';

/**
 * Read-through cache adapter over UsersRepositoryPort.
 */
export class UserCacheAdapter implements UserCachePort {
  constructor(private readonly usersRepository: UsersRepositoryPort) {}

  getList(filters: UserListFilters): Promise<UserListResult> {
    const filterKey = JSON.stringify(filters);
    const cacheKey = UserCacheKeys.usersList(filterKey);

    return cacheData(
      cacheKey,
      async () => {
        log.debug('Fetching users list from DB with filters', filters);
        return this.usersRepository.list(filters);
      },
      CacheTTL.SHORT,
    );
  }

  getSearch(term: string, page: number, limit: number): Promise<UserListResult> {
    const cacheKey = UserCacheKeys.usersSearch(`${term.toLowerCase()}:${page}:${limit}`);

    return cacheData(
      cacheKey,
      async () => {
        log.debug(`Searching users from DB: ${term}`, { page, limit });
        return this.usersRepository.search(term, page, limit);
      },
      CacheTTL.SHORT,
    );
  }

  async invalidate(userId: string, email?: string): Promise<void> {
    try {
      await invalidateCache(UserCacheKeys.user(userId));
      if (email) {
        await invalidateCache(UserCacheKeys.userByEmail(email));
      }
      await invalidateCachePattern(UserCacheKeys.usersListPattern);
      await invalidateCachePattern(UserCacheKeys.usersSearchPattern);
      log.info(`User cache invalidated for userId: ${userId}`);
    } catch (error) {
      log.error(`Failed to invalidate user cache for userId: ${userId}`, { error });
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      await invalidateCachePattern(UserCacheKeys.userPattern);
      await invalidateCachePattern(UserCacheKeys.usersListPattern);
      await invalidateCachePattern(UserCacheKeys.usersSearchPattern);
      log.info('All user caches invalidated');
    } catch (error) {
      log.error('Failed to invalidate all user caches', { error });
    }
  }
}
