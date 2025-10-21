import { ObjectId } from 'mongodb';

import prisma from '@/config/prisma/prisma';
import { CacheTTL } from '@/services/caching/Interface/caching.types';
import {
  cacheData,
  invalidateCache,
  invalidateCachePattern,
} from '@/services/caching/cache-functions';
import log from '@/services/logging/logger';

import { UserCacheKeys } from './utils/utils';

/**
 * Get user by ID with cache
 */
export const getCachedUser = async (userId: string) => {
  const cacheKey = UserCacheKeys.user(userId);

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Fetching user from DB: ${userId}`);
      return prisma.users.findUnique({
        where: { user_id: userId, is_deleted: false },
        select: {
          user_id: true,
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
      return prisma.users.findFirst({
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
            user_id: true,
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

      if (typeof searchTerm === 'string' && searchTerm.includes('@'))
        return prisma.users.findMany({
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
            user_id: true,
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

      // Si c'est un ObjectID valide
      if (ObjectId.isValid(searchTerm as string)) {
        return prisma.users.findFirst({
          where: {
            user_id: searchTerm as string,
            is_deleted: false,
          },
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
            is_active: true,
            is_verified: true,
            created_at: true,
            updated_at: true,
          },
        });
      }

      // Recherche par nom/prénom
      return prisma.users.findMany({
        where: {
          is_deleted: false,
          OR: [
            { first_name: { contains: searchTerm as string, mode: 'insensitive' } },
            { last_name: { contains: searchTerm as string, mode: 'insensitive' } },
          ],
        },
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
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
