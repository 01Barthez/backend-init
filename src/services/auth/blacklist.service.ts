import { RevokeReason, TokenFamily } from '@prisma/client';
import crypto from 'crypto';

import prisma from '@/config/prisma/client';
import redisClient from '@/services/cache/clients/redis-client';
import log from '@/services/logging/logger';

const REDIS_PREFIX = 'blacklist:';

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const blacklistService = {
  async revokeToken(params: {
    jti: string;
    token: string;
    family: TokenFamily;
    userId?: string;
    reason?: RevokeReason;
    expireAt: Date;
  }): Promise<void> {
    const tokenHash = hashToken(params.token);
    const ttlSeconds = Math.max(1, Math.floor((params.expireAt.getTime() - Date.now()) / 1000));

    await redisClient.setex(`${REDIS_PREFIX}${params.jti}`, ttlSeconds, '1');

    await prisma.blacklistEntry.upsert({
      where: { jti: params.jti },
      create: {
        jti: params.jti,
        tokenHash,
        family: params.family,
        userId: params.userId,
        reason: params.reason ?? RevokeReason.LOGOUT,
        expireAt: params.expireAt,
      },
      update: {
        tokenHash,
        reason: params.reason ?? RevokeReason.LOGOUT,
        expireAt: params.expireAt,
        revokedAt: new Date(),
      },
    });

    log.info('Token revoked', { jti: params.jti, family: params.family, reason: params.reason });
  },

  async revokeFamily(familyId: string, reason: RevokeReason): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { familyId, isRevoked: false },
    });

    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });

    await Promise.all(
      tokens.map(async (token) => {
        await redisClient.setex(`${REDIS_PREFIX}${token.jti}`, 86400 * 7, '1');
        await prisma.blacklistEntry.upsert({
          where: { jti: token.jti },
          create: {
            jti: token.jti,
            tokenHash: token.tokenHash,
            family: TokenFamily.REFRESH,
            userId: token.userId,
            reason,
            expireAt: token.expiresAt,
          },
          update: { reason, revokedAt: new Date() },
        });
      }),
    );

    log.warn('Token family revoked', { familyId, reason, count: tokens.length });
  },

  async isRevoked(jti: string): Promise<boolean> {
    const cached = await redisClient.get(`${REDIS_PREFIX}${jti}`);
    if (cached) return true;

    const entry = await prisma.blacklistEntry.findFirst({
      where: { jti, expireAt: { gt: new Date() } },
    });

    if (entry) {
      const ttl = Math.max(1, Math.floor((entry.expireAt.getTime() - Date.now()) / 1000));
      await redisClient.setex(`${REDIS_PREFIX}${jti}`, ttl, '1');
      return true;
    }

    return false;
  },

  async purgeExpired(): Promise<number> {
    const result = await prisma.blacklistEntry.deleteMany({
      where: { expireAt: { lte: new Date() } },
    });
    log.info('Expired blacklist entries purged', { count: result.count });
    return result.count;
  },
};

export default blacklistService;
