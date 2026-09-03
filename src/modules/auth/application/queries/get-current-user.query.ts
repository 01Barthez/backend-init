import { AppError } from '@/shared/domain/errors/app-error';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { RbacPort } from '../services/rbac.port';

export type GetCurrentUserResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  totpEnabled: boolean;
  roles: string[];
  permissions: string[];
};

export type GetCurrentUserDeps = {
  userRepository: UserRepositoryPort;
  rbac: RbacPort;
};

/**
 * Fresh account snapshot for GET /auth/me (not the JWT claims alone).
 */
export class GetCurrentUserQuery {
  constructor(private readonly deps: GetCurrentUserDeps) {}

  async execute(userId: string): Promise<GetCurrentUserResult> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw AppError.unauthorized('User not found');
    }

    const { permissions, roles } = await this.deps.rbac.getUserAuthContext(user.id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      totpEnabled: Boolean(user.totpEnabled),
      roles,
      permissions,
    };
  }
}
