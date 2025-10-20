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
