import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UpdateUserInput, UpdateUserResult } from '../dto/users.dto';
import type { AvatarUploaderPort } from '../services/avatar-uploader.port';
import type { UserCachePort } from '../services/user-cache.port';

export type UpdateUserDeps = {
  usersRepository: UsersRepositoryPort;
  avatarUploader: AvatarUploaderPort;
  userCache: UserCachePort;
};

/**
 * Updates the authenticated user's profile fields and optional avatar.
 */
export class UpdateUserCommand {
  constructor(private readonly deps: UpdateUserDeps) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserResult> {
    const { userId, firstName, lastName, phone, avatarFile } = input;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    const updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
    } = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    if (avatarFile) {
      updateData.avatarUrl = await this.deps.avatarUploader.upload(avatarFile);
    }

    const updated = await this.deps.usersRepository.updateProfile(userId, updateData);
    await this.deps.userCache.invalidate(userId, updated.email);

    log.info('User info updated', { userId });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
    };
  }
}
