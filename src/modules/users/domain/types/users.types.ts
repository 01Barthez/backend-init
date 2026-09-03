/**
 * Users-module view models and filter types.
 * Reuses auth `UserEntity` for identity; these shapes are API/admin oriented.
 */

export type UserPublicProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isVerified: boolean;
  isDeleted?: boolean;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  lockedUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  /** Populated on admin get-by-id when RBAC context is loaded. */
  roles?: string[];
};

export type UserListFilters = {
  isActive?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  /** Free-text filter applied on list/export when provided. */
  search?: string;
  page: number;
  limit: number;
};

export type UserListResult = {
  users: UserPublicProfile[];
  total: number;
};

export type UserExportRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
};

export type UpdateUserProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
};

export type CreateInvitedUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash: string;
};

/** Minimal row needed by delete / restore / role / lifecycle flows. */
export type UserLookupRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
  isActive?: boolean;
  isVerified?: boolean;
};
