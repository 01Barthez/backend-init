import prisma from '@/config/prisma/prisma';
import { CacheTTL } from '@/services/caching/Interface/caching.types';
import {
  cacheData,
  invalidateCache,
  invalidateCachePattern,
} from '@/services/caching/cache-functions';
import log from '@/services/logging/logger';

import { UserCacheKeys } from './utils/utils';

const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

export const getCachedUser = async (userId: string) => {
  const cacheKey = UserCacheKeys.user(userId);

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Fetching user from DB: ${userId}`);
      return prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
    CacheTTL.MEDIUM,
  );
};

export const getCachedUserByEmail = async (email: string) => {
  const cacheKey = UserCacheKeys.userByEmail(email);

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Fetching user from DB by email: ${email}`);
      return prisma.user.findFirst({
        where: { email, isDeleted: false },
      });
    },
    CacheTTL.MEDIUM,
  );
};

export const getCachedUsersList = async (filters: {
  isActive?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
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

      const where: any = { isDeleted: false };
      if (whereFilters.isActive !== undefined) where.isActive = whereFilters.isActive;
      if (whereFilters.isVerified !== undefined) where.isVerified = whereFilters.isVerified;
      if (whereFilters.isDeleted !== undefined) where.isDeleted = whereFilters.isDeleted;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            isVerified: true,
            isDeleted: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return { users, total };
    },
    CacheTTL.SHORT,
  );
};

export const getCachedUsersSearch = async (searchTerm: string) => {
  const cacheKey = UserCacheKeys.usersSearch(searchTerm.toLowerCase());

  return cacheData(
    cacheKey,
    async () => {
      log.debug(`Searching users from DB: ${searchTerm}`);

      if (typeof searchTerm === 'string' && searchTerm.includes('@'))
        return prisma.user.findMany({
          where: {
            isDeleted: false,
            OR: [
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm } },
            ],
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            isVerified: true,
          },
          take: 20,
        });

      if (isObjectId(searchTerm as string)) {
        return prisma.user.findFirst({
          where: {
            id: searchTerm as string,
            isDeleted: false,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      return prisma.user.findMany({
        where: {
          isDeleted: false,
          OR: [
            { firstName: { contains: searchTerm as string, mode: 'insensitive' } },
            { lastName: { contains: searchTerm as string, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20,
      });
    },
    CacheTTL.SHORT,
  );
};

export const invalidateUserCache = async (userId: string, email?: string) => {
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
};

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
