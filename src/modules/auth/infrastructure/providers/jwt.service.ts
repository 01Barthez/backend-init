/**
 * Convenience JWT facade for HTTP middleware.
 * Prefer injecting `TokenServicePort` via the DI container in new module code.
 */
import type { TokenPair, UserJwtPayload } from '@/modules/auth/domain/types/auth.types';
import { JwtTokenProvider } from '@/modules/auth/infrastructure/providers/jwt-token.provider';
import { createRbacAdapter } from '@/modules/auth/infrastructure/providers/legacy-adapters';
import { PrismaTokenRepository } from '@/modules/auth/infrastructure/repositories/prisma-token.repository';
import { PrismaUserRepository } from '@/modules/auth/infrastructure/repositories/prisma-user.repository';

const provider = new JwtTokenProvider({
  userRepository: new PrismaUserRepository(),
  tokenRepository: new PrismaTokenRepository(),
  rbac: createRbacAdapter(),
});

export const jwtService = {
  issueTokenPair: provider.issueTokenPair.bind(provider),
  persistRefreshToken: provider.persistRefreshToken.bind(provider),
  verifyAccessToken: provider.verifyAccessToken.bind(provider),
  verifyRefreshToken: provider.verifyRefreshToken.bind(provider),
  createPasswordResetToken: provider.createPasswordResetToken.bind(provider),
  consumePasswordResetToken: provider.consumePasswordResetToken.bind(provider),
  rotateRefreshToken: provider.rotateRefreshToken.bind(provider),
  getRefreshCookieName: provider.getRefreshCookieName.bind(provider),
};

export type { TokenPair, UserJwtPayload };
export default jwtService;
