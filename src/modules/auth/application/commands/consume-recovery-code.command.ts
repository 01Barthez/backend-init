import crypto from 'crypto';

import { config } from '@/app/config';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import redisClient from '@/shared/infrastructure/cache/clients/redis-client';
import { DUMMY_PASSWORD_HASH, comparePassword } from '@/shared/utils/crypto';

import {
  AccountInactiveError,
  AccountLockedError,
  AccountNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import type { RbacPort } from '../services/rbac.port';
import type { TokenServicePort } from '../services/token.service.port';

const REDIS_PREFIX = 'totp-recovery:';

export type ConsumeRecoveryCodeInput = {
  email: string;
  password: string;
  recoveryCode: string;
};

export type ConsumeRecoveryCodeDeps = {
  userRepository: UserRepositoryPort;
  tokenService: TokenServicePort;
  rbac: RbacPort;
  audit?: AuditPort;
};

const isLocked = (lockedUntil?: Date | null): boolean =>
  Boolean(lockedUntil && lockedUntil.getTime() > Date.now());

/**
 * Authenticates with email + password + a one-time TOTP recovery code.
 * Consumed codes are removed from Redis immediately (single-use).
 */
export class ConsumeRecoveryCodeCommand {
  constructor(private readonly deps: ConsumeRecoveryCodeDeps) {}

  async execute(input: ConsumeRecoveryCodeInput) {
    const { email, password, recoveryCode } = input;

    const user = await this.deps.userRepository.findByEmail(email);

    if (user && isLocked(user.lockedUntil)) {
      throw new AccountLockedError();
    }

    const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
    const isPasswordValid = await comparePassword(password, passwordHash);

    if (!user?.passwordHash || !isPasswordValid) {
      if (user) {
        const next = (user.failedLoginAttempts ?? 0) + 1;
        const max = config.security.lockout.maxLoginAttempts;
        await this.deps.userRepository.update(user.id, {
          failedLoginAttempts: next,
          lockedUntil: next >= max ? new Date(Date.now() + config.security.lockout.lockoutMs) : null,
        });
      }
      throw new InvalidCredentialsError();
    }

    if (!user.isVerified) throw new AccountNotVerifiedError();
    if (!user.isActive) throw new AccountInactiveError();
    if (!user.totpEnabled) throw AppError.badRequest('TOTP is not enabled on this account');

    const key = `${REDIS_PREFIX}${user.id}`;
    const hashes = await redisClient.lrange(key, 0, -1);
    if (!hashes.length) {
      throw AppError.badRequest('No recovery codes available — contact support');
    }

    const incomingHash = crypto.createHash('sha256').update(recoveryCode.trim()).digest('hex');
    const idx = hashes.indexOf(incomingHash);
    if (idx === -1) {
      throw AppError.badRequest('Invalid recovery code');
    }

    await redisClient.lset(key, idx, '__consumed__');
    await redisClient.lrem(key, 1, '__consumed__');

    await this.deps.audit?.record({
      actorId: user.id,
      action: 'auth.totp.recovery_code.consumed',
      resource: 'user',
      resourceId: user.id,
    });

    await this.deps.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const { permissions, roles } = await this.deps.rbac.getUserAuthContext(user.id);
    const tokenPair = this.deps.tokenService.issueTokenPair(
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

    await this.deps.tokenService.persistRefreshToken(
      user.id,
      tokenPair.refreshToken,
      tokenPair.refreshJti,
      tokenPair.familyId,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileUrl: user.avatarUrl,
      roles,
      permissions,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      remainingCodes: hashes.length - 1,
    };
  }
}
