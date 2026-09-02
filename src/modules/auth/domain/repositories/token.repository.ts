import type { AuthRevokeReason, AuthTokenFamily, StoredRefreshToken } from '../types/auth.types';

export type RevokeTokenInput = {
  jti: string;
  token: string;
  family: AuthTokenFamily;
  userId?: string;
  reason?: AuthRevokeReason;
  expireAt: Date;
};

export type PersistRefreshTokenInput = {
  userId: string;
  jti: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
};

/**
 * Port covering refresh-token persistence and blacklist operations.
 * Keeps JWT crypto out of this interface — that lives on TokenServicePort.
 */
export interface TokenRepositoryPort {
  persistRefreshToken(input: PersistRefreshTokenInput): Promise<void>;

  findRefreshTokenByJti(jti: string): Promise<StoredRefreshToken | null>;

  markRefreshTokenReplaced(jti: string, replacedBy: string): Promise<void>;

  revokeToken(input: RevokeTokenInput): Promise<void>;

  revokeFamily(familyId: string, reason: AuthRevokeReason): Promise<void>;

  isRevoked(jti: string): Promise<boolean>;

  /** Revoke every refresh family for a user (password change / security event). */
  revokeAllForUser(userId: string, reason: AuthRevokeReason): Promise<void>;

  savePasswordResetToken(userId: string, tokenHash: string, ttlSeconds: number): Promise<void>;

  consumePasswordResetToken(tokenHash: string): Promise<string | null>;

  purgeExpired(): Promise<number>;
}
