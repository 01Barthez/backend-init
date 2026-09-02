import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';
import { hashPassword } from '@/shared/utils/crypto';

import { InvalidResetTokenError } from '../../domain/errors/auth.errors';
import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { ResetPasswordInput } from '../dto/auth.dto';
import type { TokenServicePort } from '../services/token.service.port';
import type { UserCachePort } from '../services/user-cache.port';

export type ResetPasswordCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenService: TokenServicePort;
  tokenRepository: TokenRepositoryPort;
  userCache?: UserCachePort;
};

/**
 * Consumes a single-use reset token, replaces the password, and revokes sessions.
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
      const consumed = await this.deps.tokenService.consumePasswordResetToken(resetToken);
      userId = consumed.userId;
    } catch {
      throw new InvalidResetTokenError();
    }

    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new InvalidResetTokenError();
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.deps.userRepository.update(userId, {
      passwordHash: hashedPassword,
      lastPasswordChange: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await this.deps.tokenRepository.revokeAllForUser(userId, 'PASSWORD_CHANGE');
    await this.deps.userCache?.invalidate(userId, user.email);

    log.info('Password reset successfully', { userId });
  }
}
