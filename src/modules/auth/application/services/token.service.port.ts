import type { TokenPair, UserJwtPayload } from '../../domain/types/auth.types';

/**
 * Application port for JWT issue / verify / rotate.
 * Implemented by infrastructure JwtTokenProvider.
 */
export interface TokenServicePort {
  issueTokenPair(user: UserJwtPayload, permissions: string[], roles: string[]): TokenPair;

  persistRefreshToken(
    userId: string,
    refreshToken: string,
    refreshJti: string,
    familyId: string,
  ): Promise<void>;

  verifyAccessToken(token: string): UserJwtPayload;

  verifyRefreshToken(token: string): UserJwtPayload & { familyId: string; jti: string };

  generatePasswordResetToken(userId: string): string;

  verifyPasswordResetToken(token: string): { userId: string; jti: string };

  rotateRefreshToken(oldToken: string): Promise<TokenPair>;

  getRefreshCookieName(): string;
}
