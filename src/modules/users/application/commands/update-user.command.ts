import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { UpdateUserInput, UpdateUserResult } from '../dto/users.dto';
import type { AvatarUploaderPort } from '../services/avatar-uploader.port';
import type { UserCachePort } from '../services/user-cache.port';

export type UpdateUserDeps = {
  usersRepository: UsersRepositoryPort;
  avatarUploader: AvatarUploaderPort;
  userCache: UserCachePort;
  audit?: AuditPort;
};

/**
 * Updates a user profile (self via /profile or admin via PATCH /:userId).
 * Does not change email or password — those stay in the auth module.
 */
export class UpdateUserCommand {
  constructor(private readonly deps: UpdateUserDeps) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserResult> {
    const { userId, firstName, lastName, phone, avatarFile, clearAvatar } = input;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    const existing = await this.deps.usersRepository.findLookupById(userId);
    if (!existing) {
      throw AppError.notFound('User not found');
    }

    const updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string | null;
    } = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    if (clearAvatar) {
      updateData.avatarUrl = null;
    } else if (avatarFile) {
      updateData.avatarUrl = await this.deps.avatarUploader.upload(avatarFile);
    }

    if (Object.keys(updateData).length === 0) {
      throw AppError.badRequest('No profile fields to update');
    }

    const updated = await this.deps.usersRepository.updateProfile(userId, updateData);
    await this.deps.userCache.invalidate(userId, updated.email);

    await this.deps.audit?.record({
      action: 'user.profile_update',
      resource: 'user',
      resourceId: userId,
      metadata: { fields: Object.keys(updateData) },
    });

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
