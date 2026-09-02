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
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserListFilters = {
  isActive?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
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
  avatarUrl?: string;
};

/** Minimal row needed by delete / restore / role flows (email + name). */
export type UserLookupRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
};
