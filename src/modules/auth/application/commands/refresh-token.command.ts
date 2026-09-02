import log from '@/shared/infrastructure/logging/logger';
import { AppError } from '@/shared/domain/errors/app-error';

import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import type { RefreshTokenInput, RefreshTokenResult } from '../dto/auth.dto';
import type { TokenServicePort } from '../services/token.service.port';

export type RefreshTokenCommandDeps = {
  tokenService: TokenServicePort;
};

/**
 * Rotates a refresh token and returns a new access/refresh pair.
 * Reuse detection is handled inside TokenServicePort.
 */
export class RefreshTokenCommand {
  constructor(private readonly deps: RefreshTokenCommandDeps) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const { refreshToken } = input;

    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token is required');
    }

    try {
      const pair = await this.deps.tokenService.rotateRefreshToken(refreshToken);
      return {
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      log.warn('Refresh token rotation failed', { error: message });
      throw new InvalidRefreshTokenError();
    }
  }
}
