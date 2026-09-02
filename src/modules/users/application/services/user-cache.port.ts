import type {
  UserListFilters,
  UserListResult,
  UserPublicProfile,
} from '../../domain/types/users.types';

/**
 * Read-through cache + invalidation for user list/search/profile keys.
 */
export interface UserCachePort {
  getList(filters: UserListFilters): Promise<UserListResult>;

  getSearch(term: string): Promise<UserPublicProfile[] | UserPublicProfile | null>;

  invalidate(userId: string, email?: string): Promise<void>;

  invalidateAll(): Promise<void>;
}
