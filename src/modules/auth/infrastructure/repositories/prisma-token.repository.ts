import type { RevokeReason } from '@prisma/client';
import { TokenFamily } from '@prisma/client';

import redisClient from '@/shared/infrastructure/cache/clients/redis-client';
import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';
import { hashToken } from '@/shared/utils/crypto';

import type {
  PersistRefreshTokenInput,
  RevokeTokenInput,
  TokenRepositoryPort,
} from '../../domain/repositories/token.repository';
import type {
  AuthRevokeReason,
  AuthSessionSummary,
  AuthTokenFamily,
  StoredRefreshToken,
} from '../../domain/types/auth.types';

const REDIS_PREFIX = 'blacklist:';

const toPrismaFamily = (family: AuthTokenFamily): TokenFamily => family as TokenFamily;
const toPrismaReason = (reason: AuthRevokeReason): RevokeReason => reason as RevokeReason;

/**
 * Prisma + Redis implementation of TokenRepositoryPort.
 * Redis is the fast-path check; Prisma is the durable source of truth.
 */
export class PrismaTokenRepository implements TokenRepositoryPort {
  async persistRefreshToken(input: PersistRefreshTokenInput): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId: input.userId,
        jti: input.jti,
        tokenHash: input.tokenHash,
        familyId: input.familyId,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findRefreshTokenByJti(jti: string): Promise<StoredRefreshToken | null> {
    const stored = await prisma.refreshToken.findUnique({ where: { jti } });
    if (!stored) return null;
    return {
      id: stored.id,
      userId: stored.userId,
      jti: stored.jti,
      tokenHash: stored.tokenHash,
      familyId: stored.familyId,
      isRevoked: stored.isRevoked,
      replacedBy: stored.replacedBy,
      expiresAt: stored.expiresAt,
      lastUsedAt: stored.lastUsedAt,
    };
  }

  async markRefreshTokenReplaced(jti: string, replacedBy: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { jti },
      data: { isRevoked: true, replacedBy, lastUsedAt: new Date() },
    });
  }

  /**
   * Compare-and-swap revoke used by refresh rotation to prevent dual live tokens.
   */
  async claimRefreshTokenForRotation(jti: string, replacedBy: string): Promise<boolean> {
    const result = await prisma.refreshToken.updateMany({
      where: { jti, isRevoked: false },
      data: { isRevoked: true, replacedBy, lastUsedAt: new Date() },
    });
    return result.count === 1;
  }

  async revokeToken(input: RevokeTokenInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const ttlSeconds = Math.max(1, Math.floor((input.expireAt.getTime() - Date.now()) / 1000));
    const reason = toPrismaReason(input.reason ?? 'LOGOUT');

    await redisClient.setex(`${REDIS_PREFIX}${input.jti}`, ttlSeconds, '1');

    await prisma.blacklistEntry.upsert({
      where: { jti: input.jti },
      create: {
        jti: input.jti,
        tokenHash,
        family: toPrismaFamily(input.family),
        userId: input.userId,
        reason,
        expireAt: input.expireAt,
      },
      update: {
        tokenHash,
        reason,
        expireAt: input.expireAt,
        revokedAt: new Date(),
      },
    });

    log.info('Token revoked', { jti: input.jti, family: input.family, reason: input.reason });
  }

  async revokeFamily(familyId: string, reason: AuthRevokeReason): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { familyId, isRevoked: false },
    });

    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });

    const prismaReason = toPrismaReason(reason);

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
            reason: prismaReason,
            expireAt: token.expiresAt,
          },
          update: { reason: prismaReason, revokedAt: new Date() },
        });
      }),
    );

    log.warn('Token family revoked', { familyId, reason, count: tokens.length });
  }

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
  }

  async revokeAllForUser(userId: string, reason: AuthRevokeReason): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
      select: { familyId: true },
    });
    const families = [...new Set(tokens.map((row) => row.familyId))];
    await Promise.all(families.map((familyId) => this.revokeFamily(familyId, reason)));
  }

  async listSessionsForUser(userId: string): Promise<AuthSessionSummary[]> {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const byFamily = new Map<string, AuthSessionSummary>();
    for (const token of tokens) {
      if (byFamily.has(token.familyId)) continue;
      byFamily.set(token.familyId, {
        familyId: token.familyId,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        isRevoked: token.isRevoked,
      });
    }

    return [...byFamily.values()];
  }

  async familyBelongsToUser(familyId: string, userId: string): Promise<boolean> {
    const row = await prisma.refreshToken.findFirst({
      where: { familyId, userId },
      select: { id: true },
    });
    return Boolean(row);
  }

  async savePasswordResetToken(
    userId: string,
    tokenHash: string,
    ttlSeconds: number,
  ): Promise<void> {
    await redisClient.setex(`pwd-reset:${tokenHash}`, Math.max(1, ttlSeconds), userId);
  }

  async consumePasswordResetToken(tokenHash: string): Promise<string | null> {
    const key = `pwd-reset:${tokenHash}`;
    // Atomic get-and-delete — prevents double consume under concurrent resets.
    const userId = await redisClient.getdel(key);
    return userId;
  }

  async purgeExpired(): Promise<number> {
    const result = await prisma.blacklistEntry.deleteMany({
      where: { expireAt: { lte: new Date() } },
    });
    log.info('Expired blacklist entries purged', { count: result.count });
    return result.count;
  }
}
