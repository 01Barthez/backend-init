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
};

export type UpdateUserResult = Pick<
  UserPublicProfile,
  'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl'
>;

export type ListUsersInput = {
  isActive?: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  page?: number;
  limit?: number;
};

export type ListUsersResult = UserListResult & {
  page: number;
  limit: number;
  totalPages: number;
};

export type ExportUsersResult = {
  csv: string;
  count: number;
  rows: UserExportRow[];
};

export type SearchUsersResult = UserPublicProfile[] | UserPublicProfile | null;
