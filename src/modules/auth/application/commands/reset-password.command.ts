import log from '@/shared/infrastructure/logging/logger';
import { AppError } from '@/shared/domain/errors/app-error';
import { hash_password } from '@/shared/utils/password/hash-password';

import { InvalidResetTokenError } from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { ResetPasswordInput } from '../dto/auth.dto';
import type { TokenServicePort } from '../services/token.service.port';
import type { UserCachePort } from '../services/user-cache.port';

export type ResetPasswordCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenService: TokenServicePort;
  userCache?: UserCachePort;
};

/**
 * Validates a password-reset JWT and replaces the user's password hash.
 */
export class ResetPasswordCommand {
  constructor(private readonly deps: ResetPasswordCommandDeps) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const { resetToken, newPassword } = input;

    if (!resetToken || !newPassword) {
      throw AppError.badRequest('Missing required field(s): resetToken, new_password');
    }

    let userId: string;
    try {
      const decoded = this.deps.tokenService.verifyPasswordResetToken(resetToken);
      userId = decoded.userId;
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      log.error('Password reset failed', { error: err.message });
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        throw new InvalidResetTokenError();
      }
      if (err.message === 'Invalid token type') {
        throw new InvalidResetTokenError();
      }
      throw AppError.internal('Failed to reset password');
    }

    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const hashedPassword = await hash_password(newPassword);
    if (!hashedPassword) {
      throw AppError.internal('Failed to hash password');
    }

    await this.deps.userRepository.update(userId, { passwordHash: hashedPassword });
    await this.deps.userCache?.invalidate(userId, user.email);

    log.info('Password reset successfully', { userId });
  }
}
