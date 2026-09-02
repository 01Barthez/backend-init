import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { envs } from '@/app/config';
import { AUTH_COOKIES } from '@/shared/constants/app.constants';
import { readFileSync } from '@/shared/utils/fs-utils';

import type { RbacPort } from '../../application/services/rbac.port';
import type { TokenServicePort } from '../../application/services/token.service.port';
import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { TokenPair, UserJwtPayload } from '../../domain/types/auth.types';
import { hashToken } from '../repositories/prisma-token.repository';

const generateJti = (): string => uuidv4();
const generateFamilyId = (): string => crypto.randomBytes(16).toString('hex');

export type JwtTokenProviderDeps = {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  rbac: RbacPort;
};

/**
 * JWT TokenServicePort implementation.
 * Crypto stays here; persistence goes through TokenRepositoryPort / UserRepositoryPort.
 */
export class JwtTokenProvider implements TokenServicePort {
  constructor(private readonly deps: JwtTokenProviderDeps) {}

  issueTokenPair(user: UserJwtPayload, permissions: string[], roles: string[]): TokenPair {
    const accessJti = generateJti();
    const refreshJti = generateJti();
    const familyId = generateFamilyId();

    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      permissions,
      roles,
    };

    const accessToken = jwt.sign(
      { ...payload, jti: accessJti, type: 'ACCESS' },
      readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: envs.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      },
    );

    const refreshToken = jwt.sign(
      { ...payload, jti: refreshJti, familyId, type: 'REFRESH' },
      readFileSync(envs.JWT_REFRESH_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: envs.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, accessJti, refreshJti, familyId };
  }

  async persistRefreshToken(
    userId: string,
    refreshToken: string,
    refreshJti: string,
    familyId: string,
  ): Promise<void> {
    const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 86400000);

    await this.deps.tokenRepository.persistRefreshToken({
      userId,
      jti: refreshJti,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt,
    });
  }

  verifyAccessToken(token: string): UserJwtPayload {
    return jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '') as UserJwtPayload;
  }

  verifyRefreshToken(token: string): UserJwtPayload & { familyId: string; jti: string } {
    return jwt.verify(
      token,
      readFileSync(envs.JWT_REFRESH_PUBLIC_KEY_PATH) || '',
    ) as UserJwtPayload & { familyId: string; jti: string };
  }

  generatePasswordResetToken(userId: string): string {
    const jti = generateJti();
    return jwt.sign(
      { userId, jti, type: 'PASSWORD_RESET' },
      readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: '1h',
      },
    );
  }

  verifyPasswordResetToken(token: string): { userId: string; jti: string } {
    const decoded = jwt.verify(
      token,
      readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '',
    ) as jwt.JwtPayload & { userId: string; jti: string; type: string };

    if (decoded.type !== 'PASSWORD_RESET') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId, jti: decoded.jti };
  }

  /**
   * Rotate with reuse detection: a revoked/unknown jti or hash mismatch
   * revokes the entire refresh-token family.
   */
  async rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    const decoded = this.verifyRefreshToken(oldToken);
    const stored = await this.deps.tokenRepository.findRefreshTokenByJti(decoded.jti);

    if (!stored || stored.isRevoked) {
      if (stored?.familyId) {
        await this.deps.tokenRepository.revokeFamily(stored.familyId, 'REUSE_DETECTED');
      }
      throw new Error('Refresh token reuse detected');
    }

    if (stored.tokenHash !== hashToken(oldToken)) {
      await this.deps.tokenRepository.revokeFamily(stored.familyId, 'REUSE_DETECTED');
      throw new Error('Invalid refresh token');
    }

    const user = await this.deps.userRepository.findById(decoded.id);
    if (!user || !user.isVerified || !user.isActive) {
      throw new Error('User not eligible for token refresh');
    }

    const { permissions, roles } = await this.deps.rbac.getUserAuthContext(user.id);

    const pair = this.issueTokenPair(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isActive: user.isActive,
      },
      permissions,
      roles,
    );

    await this.deps.tokenRepository.markRefreshTokenReplaced(decoded.jti, pair.refreshJti);
    await this.persistRefreshToken(user.id, pair.refreshToken, pair.refreshJti, decoded.familyId);

    return pair;
  }

  getRefreshCookieName(): string {
    return AUTH_COOKIES.REFRESH_TOKEN;
  }
}
