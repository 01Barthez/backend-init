import type {
  CreateInvitedUserInput,
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

  findLookupByEmail(email: string): Promise<UserLookupRecord | null>;

  list(filters: UserListFilters): Promise<UserListResult>;

  /**
   * Search by email / name / phone, or exact ObjectId.
   * Always returns a paginated list (ObjectId match → 0–1 row).
   */
  search(term: string, page: number, limit: number): Promise<UserListResult>;

  exportActive(filters?: Omit<UserListFilters, 'page' | 'limit'>): Promise<UserExportRow[]>;

  updateProfile(userId: string, data: UpdateUserProfileInput): Promise<UserPublicProfile>;

  setActive(userId: string, isActive: boolean): Promise<UserPublicProfile>;

  markEmailVerified(userId: string): Promise<UserPublicProfile>;

  unlockLogin(userId: string): Promise<UserPublicProfile>;

  createInvited(data: CreateInvitedUserInput): Promise<UserPublicProfile>;

  softDelete(userId: string): Promise<void>;

  /** Clears soft-delete flags and reactivates when the account is verified. */
  restore(userId: string): Promise<UserLookupRecord>;

  hardDelete(userId: string): Promise<void>;

  clearAll(): Promise<void>;
}
