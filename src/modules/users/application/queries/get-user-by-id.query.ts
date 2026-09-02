import { AppError } from '@/shared/domain/errors/app-error';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UserPublicProfile } from '../../domain/types/users.types';

export type GetUserByIdDeps = {
  usersRepository: UsersRepositoryPort;
};

/**
 * Fetch a single non-deleted user by id for admin views.
 */
export class GetUserByIdQuery {
  constructor(private readonly deps: GetUserByIdDeps) {}

  async execute(userId: string): Promise<UserPublicProfile> {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const user = await this.deps.usersRepository.findPublicById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }
}
