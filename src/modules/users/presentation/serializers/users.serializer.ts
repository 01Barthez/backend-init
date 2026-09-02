import type { ListUsersResult, UpdateUserResult } from '../../application/dto/users.dto';
import type { UserLookupRecord, UserPublicProfile } from '../../domain/types/users.types';

/**
 * Maps use-case results to the public API response shape.
 */
export const UsersSerializer = {
  profile(user: UpdateUserResult | UserPublicProfile) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      avatarUrl: 'avatarUrl' in user ? (user.avatarUrl ?? null) : null,
    };
  },

  publicUser(user: UserPublicProfile) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  list(result: ListUsersResult) {
    return result.users;
  },

  restored(user: UserLookupRecord) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isDeleted: user.isDeleted,
    };
  },
};
