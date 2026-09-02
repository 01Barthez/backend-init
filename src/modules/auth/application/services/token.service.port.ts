import type { TokenPair, UserJwtPayload } from '../../domain/types/auth.types';

/**
 * Application port for JWT issue / verify / rotate and opaque reset tokens.
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

  /** Opaque single-use reset token (hashed in Redis). */
  createPasswordResetToken(userId: string): Promise<string>;

  consumePasswordResetToken(token: string): Promise<{ userId: string }>;

  rotateRefreshToken(oldToken: string): Promise<TokenPair>;

  getRefreshCookieName(): string;
}
