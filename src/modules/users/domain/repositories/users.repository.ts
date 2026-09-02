import type {
  UpdateUserProfileInput,
  UserExportRow,
  UserListFilters,
  UserListResult,
  UserLookupRecord,
  UserPublicProfile,
} from '../types/users.types';

/**
 * Persistence port for user administration (CRUD beyond auth signup/login).
 * Soft-deleted users are excluded by default unless noted.
 */
export interface UsersRepositoryPort {
  findPublicById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<UserPublicProfile | null>;

  findLookupById(
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<UserLookupRecord | null>;

  list(filters: UserListFilters): Promise<UserListResult>;

  /**
   * Search by email / name / phone, or exact ObjectId.
   * May return a single profile when the term is an id.
   */
  search(term: string): Promise<UserPublicProfile[] | UserPublicProfile | null>;

  exportActive(): Promise<UserExportRow[]>;

  updateProfile(userId: string, data: UpdateUserProfileInput): Promise<UserPublicProfile>;

  softDelete(userId: string): Promise<void>;

  restore(userId: string): Promise<UserLookupRecord>;

  hardDelete(userId: string): Promise<void>;

  clearAll(): Promise<void>;
}
