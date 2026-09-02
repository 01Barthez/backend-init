import { RevokeReason, TokenFamily } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/client';
import { AUTH_COOKIES } from '@/core/constants/app.constants';
import type { TokenPair, UserJwtPayload } from '@/core/interfaces/auth.interface';
import blacklistService, { hashToken } from '@/services/auth/blacklist.service';
import { readFileSync } from '@/utils/fs-utils';

const generateJti = (): string => uuidv4();
const generateFamilyId = (): string => crypto.randomBytes(16).toString('hex');

export const jwtService = {
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
      { ...payload, jti: accessJti, type: TokenFamily.ACCESS },
      readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: envs.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      },
    );

    const refreshToken = jwt.sign(
      { ...payload, jti: refreshJti, familyId, type: TokenFamily.REFRESH },
      readFileSync(envs.JWT_REFRESH_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: envs.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, accessJti, refreshJti, familyId };
  },

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

    await prisma.refreshToken.create({
      data: {
        userId,
        jti: refreshJti,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt,
      },
    });
  },

  verifyAccessToken(token: string): UserJwtPayload {
    return jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '') as UserJwtPayload;
  },

  verifyRefreshToken(token: string): UserJwtPayload & { familyId: string; jti: string } {
    return jwt.verify(
      token,
      readFileSync(envs.JWT_REFRESH_PUBLIC_KEY_PATH) || '',
    ) as UserJwtPayload & { familyId: string; jti: string };
  },

  generatePasswordResetToken(userId: string): string {
    const jti = generateJti();
    return jwt.sign(
      { userId, jti, type: TokenFamily.PASSWORD_RESET },
      readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '',
      {
        algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
        expiresIn: '1h',
      },
    );
  },

  verifyPasswordResetToken(token: string): { userId: string; jti: string } {
    const decoded = jwt.verify(
      token,
      readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '',
    ) as jwt.JwtPayload & { userId: string; jti: string; type: string };

    if (decoded.type !== TokenFamily.PASSWORD_RESET) {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId, jti: decoded.jti };
  },

  async rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    const decoded = this.verifyRefreshToken(oldToken);
    const stored = await prisma.refreshToken.findUnique({ where: { jti: decoded.jti } });

    if (!stored || stored.isRevoked) {
      if (stored?.familyId) {
        await blacklistService.revokeFamily(stored.familyId, RevokeReason.REUSE_DETECTED);
      }
      throw new Error('Refresh token reuse detected');
    }

    if (stored.tokenHash !== hashToken(oldToken)) {
      await blacklistService.revokeFamily(stored.familyId, RevokeReason.REUSE_DETECTED);
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isDeleted: false },
    });

    if (!user || !user.isVerified || !user.isActive) {
      throw new Error('User not eligible for token refresh');
    }

    const { permissions, roles } = await import('@/services/auth/rbac.service').then((m) =>
      m.rbacService.getUserAuthContext(user.id),
    );

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

    await prisma.refreshToken.update({
      where: { jti: decoded.jti },
      data: { isRevoked: true, replacedBy: pair.refreshJti, lastUsedAt: new Date() },
    });

    await this.persistRefreshToken(user.id, pair.refreshToken, pair.refreshJti, decoded.familyId);

    return pair;
  },

  getRefreshCookieName(): string {
    return AUTH_COOKIES.REFRESH_TOKEN;
  },
};

export default jwtService;
