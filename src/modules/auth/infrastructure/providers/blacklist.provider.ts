import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { AuthRevokeReason, AuthTokenFamily } from '../../domain/types/auth.types';
import { PrismaTokenRepository, hashToken } from '../repositories/prisma-token.repository';

/**
 * Thin facade over TokenRepositoryPort blacklist operations.
 * Kept as a named provider so legacy `blacklist.service` can re-export it.
 */
export class BlacklistProvider {
  constructor(private readonly tokens: TokenRepositoryPort = new PrismaTokenRepository()) {}

  revokeToken(params: {
    jti: string;
    token: string;
    family: AuthTokenFamily;
    userId?: string;
    reason?: AuthRevokeReason;
    expireAt: Date;
  }): Promise<void> {
    return this.tokens.revokeToken(params);
  }

  revokeFamily(familyId: string, reason: AuthRevokeReason): Promise<void> {
    return this.tokens.revokeFamily(familyId, reason);
  }

  isRevoked(jti: string): Promise<boolean> {
    return this.tokens.isRevoked(jti);
  }

  purgeExpired(): Promise<number> {
    return this.tokens.purgeExpired();
  }
}

export { hashToken };
export const blacklistProvider = new BlacklistProvider();
export default blacklistProvider;
