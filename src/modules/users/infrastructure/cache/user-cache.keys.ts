/**
 * Cache key helpers for user list / search / profile invalidation.
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
