import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { LogoutInput } from '../dto/auth.dto';
import type { TokenServicePort } from '../services/token.service.port';

export type LogoutCommandDeps = {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  tokenService: TokenServicePort;
};

/**
 * Revokes the current refresh token (best-effort) and marks the user inactive.
 * Cookie / header clearing stays in the presentation layer.
 */
export class LogoutCommand {
  constructor(private readonly deps: LogoutCommandDeps) {}

  async execute(input: LogoutInput): Promise<{ refreshCookieName: string }> {
    const { userId, refreshToken } = input;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    const refreshCookieName = this.deps.tokenService.getRefreshCookieName();

    if (refreshToken) {
      try {
        const decoded = this.deps.tokenService.verifyRefreshToken(refreshToken);
        await this.deps.tokenRepository.revokeToken({
          jti: decoded.jti,
          token: refreshToken,
          family: 'REFRESH',
          userId,
          reason: 'LOGOUT',
          expireAt: new Date((decoded.exp ?? 0) * 1000),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        log.warn('Failed to revoke refresh token on logout', { error: message });
      }
    }

    await this.deps.userRepository.setActive(userId, false);
    log.info('User logged out successfully', { userId });

    return { refreshCookieName };
  }
}
