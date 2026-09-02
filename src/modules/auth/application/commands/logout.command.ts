import { AppError } from '@/shared/domain/errors/app-error';
import log from '@/shared/infrastructure/logging/logger';

import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { LogoutInput } from '../dto/auth.dto';
import type { TokenServicePort } from '../services/token.service.port';

export type LogoutCommandDeps = {
  tokenRepository: TokenRepositoryPort;
  tokenService: TokenServicePort;
};

/**
 * Ends the current session: blacklist access jti + revoke refresh.
 * Does not flip `user.isActive` — that flag is account status, not presence.
 */
export class LogoutCommand {
  constructor(private readonly deps: LogoutCommandDeps) {}

  async execute(input: LogoutInput): Promise<{ refreshCookieName: string }> {
    const { userId, refreshToken, accessJti, accessExpiresAt } = input;

    if (!userId) {
      throw AppError.unauthorized('User not authenticated');
    }

    const refreshCookieName = this.deps.tokenService.getRefreshCookieName();

    if (accessJti) {
      await this.deps.tokenRepository.revokeToken({
        jti: accessJti,
        token: accessJti,
        family: 'ACCESS',
        userId,
        reason: 'LOGOUT',
        expireAt: accessExpiresAt ?? new Date(Date.now() + 15 * 60_000),
      });
    }

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
        if (decoded.familyId) {
          await this.deps.tokenRepository.revokeFamily(decoded.familyId, 'LOGOUT');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        log.warn('Failed to revoke refresh token on logout', { error: message });
      }
    }

    log.info('User logged out successfully', { userId });
    return { refreshCookieName };
  }
}
