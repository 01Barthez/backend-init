import crypto from 'crypto';

import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import redisClient from '@/shared/infrastructure/cache/clients/redis-client';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';

const CODE_COUNT = 8;
const CODE_BYTES = 5; // 10 hex chars per code
const REDIS_PREFIX = 'totp-recovery:';
/** Recovery codes remain usable for 90 days after generation. */
const CODE_TTL_SECONDS = 60 * 60 * 24 * 90;

export type GenerateRecoveryCodesDeps = {
  userRepository: UserRepositoryPort;
  audit?: AuditPort;
};

export type GenerateRecoveryCodesInput = {
  userId: string;
};

export type GenerateRecoveryCodesResult = {
  /** Plaintext codes shown exactly once. User must store them safely. */
  codes: string[];
};

/**
 * Generates one-time TOTP recovery codes.
 * Hashes are stored in Redis; plaintext is returned once and never persisted.
 */
export class GenerateRecoveryCodesCommand {
  constructor(private readonly deps: GenerateRecoveryCodesDeps) {}

  async execute(input: GenerateRecoveryCodesInput): Promise<GenerateRecoveryCodesResult> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    if (!user.totpEnabled) {
      throw AppError.badRequest('TOTP is not enabled — enable it before generating recovery codes');
    }

    const key = `${REDIS_PREFIX}${input.userId}`;
    await redisClient.del(key);

    const codes: string[] = [];
    const hashed: string[] = [];

    for (let i = 0; i < CODE_COUNT; i++) {
      const plain = crypto.randomBytes(CODE_BYTES).toString('hex');
      codes.push(plain);
      hashed.push(crypto.createHash('sha256').update(plain).digest('hex'));
    }

    await redisClient.rpush(key, ...hashed);
    await redisClient.expire(key, CODE_TTL_SECONDS);

    await this.deps.audit?.record({
      actorId: input.userId,
      action: 'auth.totp.recovery_codes.generate',
      resource: 'user',
      resourceId: input.userId,
    });

    return { codes };
  }
}
