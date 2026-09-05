import type {
  UserExportRow,
  UserListResult,
  UserPublicProfile,
} from '../../domain/types/users.types';

export type UpdateUserInput = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarFile?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  /** When true, clear avatarUrl (takes precedence over avatarFile). */
  clearAvatar?: boolean;
};

export type UpdateUserResult = Pick<
  UserPublicProfile,
  'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl'
>;

export type ListUsersInput = {
  isActive?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type ListUsersResult = UserListResult & {
  page: number;
  limit: number;
  totalPages: number;
};

export type SearchUsersInput = {
  search: string;
  page?: number;
  limit?: number;
};

export type ExportUsersInput = {
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
};

export type ExportUsersResult = {
  csv: string;
  count: number;
  rows: UserExportRow[];
  /** True when the repository hit the sync export row cap. */
  truncated?: boolean;
};

export type InviteUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleSlug?: string;
  /** Required when inviting with a non-USER role (checked for user:role:assign). */
  actorId?: string;
};

export type InviteUserResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
};
