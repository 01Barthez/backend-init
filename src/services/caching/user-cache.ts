import prisma from '@/config/prisma/prisma';

import log from '../logging/logger';
import cacheData, { CacheTTL, invalidateCache, invalidateCachePattern } from './cache-data';

/**
 * User-specific cache service with optimized cache keys and invalidation strategies
 */

export const UserCacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  usersList: (filters: string) => `users:list:${filters}`,
  usersSearch: (query: string) => `users:search:${query}`,
  usersCount: (filters: string) => `users:count:${filters}`,
  userPattern: 'user:*',
  usersListPattern: 'users:list:*',
  usersSearchPattern: 'users:search:*',
};

/**
 * Get user by ID with cache
 */
export const getCachedUser = async (userId: string) => {
  const cacheKey = UserCacheKeys.user(userId);

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Fetching user from DB: ${userId}`);
      return await prisma.users.findUnique({
        where: { id: userId, is_deleted: false },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          email_verified_at: true,
          created_at: true,
          updated_at: true,
        },
      });
    },
    CacheTTL.MEDIUM,
  );
};

/**
 * Get user by email with cache
 */
export const getCachedUserByEmail = async (email: string) => {
  const cacheKey = UserCacheKeys.userByEmail(email);

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Fetching user from DB by email: ${email}`);
      return await prisma.users.findFirst({
        where: { email, is_deleted: false },
      });
    },
    CacheTTL.MEDIUM,
  );
};

/**
 * Get users list with cache (for admin)
 */
export const getCachedUsersList = async (filters: {
  is_active?: boolean;
  is_verified?: boolean;
  is_deleted?: boolean;
  page: number;
  limit: number;
}) => {
  const filterKey = JSON.stringify(filters);
  const cacheKey = UserCacheKeys.usersList(filterKey);

  return cacheData(
    cacheKey,
    async () => {
      log.debug('Fetching users list from DB with filters', filters);

      const { page, limit, ...whereFilters } = filters;
      const skip = (page - 1) * limit;

      const where: any = { is_deleted: false };
      if (whereFilters.is_active !== undefined) where.is_active = whereFilters.is_active;
      if (whereFilters.is_verified !== undefined) where.is_verified = whereFilters.is_verified;
      if (whereFilters.is_deleted !== undefined) where.is_deleted = whereFilters.is_deleted;

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            avatar_url: true,
            is_active: true,
            is_verified: true,
            is_deleted: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
        }),
        prisma.users.count({ where }),
      ]);

      return { users, total };
    },
    CacheTTL.SHORT, // Short TTL for frequently changing data
  );
};

/**
 * Search users with cache
 */
export const getCachedUsersSearch = async (searchTerm: string) => {
  const cacheKey = UserCacheKeys.usersSearch(searchTerm.toLowerCase());

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Searching users from DB: ${searchTerm}`);

      return await prisma.users.findMany({
        where: {
          is_deleted: false,
          OR: [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { first_name: { contains: searchTerm, mode: 'insensitive' } },
            { last_name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } },
          ],
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
        },
        take: 20,
      });
    },
    CacheTTL.SHORT,
  );
};

/**
 * Invalidate user cache when user data changes
 */
export const invalidateUserCache = async (userId: string, email?: string) => {
  try {
    await invalidateCache(UserCacheKeys.user(userId));
    if (email) {
      await invalidateCache(UserCacheKeys.userByEmail(email));
    }
    // Invalidate all users lists and searches since they might contain this user
    await invalidateCachePattern(UserCacheKeys.usersListPattern);
    await invalidateCachePattern(UserCacheKeys.usersSearchPattern);

    log.info(`User cache invalidated for userId: ${userId}`);
  } catch (error) {
    log.error(`Failed to invalidate user cache for userId: ${userId}`, { error });
    // Don't throw - cache invalidation failure shouldn't break the operation
  }
};

/**
 * Invalidate all user-related caches
 */
export const invalidateAllUserCaches = async () => {
  try {
    await invalidateCachePattern(UserCacheKeys.userPattern);
    await invalidateCachePattern(UserCacheKeys.usersListPattern);
    await invalidateCachePattern(UserCacheKeys.usersSearchPattern);
    log.info('All user caches invalidated');
  } catch (error) {
    log.error('Failed to invalidate all user caches', { error });
  }
};
