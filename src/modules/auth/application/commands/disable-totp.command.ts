import { AppError } from '@/shared/domain/errors/app-error';
import { TotpInvalidError } from '@/shared/domain/errors/security.errors';
import type { AuditPort } from '@/shared/infrastructure/audit';
import { comparePassword } from '@/shared/utils/crypto';

import { IncorrectPasswordError } from '../../domain/errors/auth.errors';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import { decryptTotpSecret, isValidTotpCode } from '../services/totp';

export type DisableTotpInput = {
  userId: string;
  totpCode: string;
  currentPassword: string;
};

export type DisableTotpDeps = {
  userRepository: UserRepositoryPort;
  audit?: AuditPort;
};

/**
 * Turns TOTP off after verifying the current password and a valid code.
 */
export class DisableTotpCommand {
  constructor(private readonly deps: DisableTotpDeps) {}

  async execute(input: DisableTotpInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw AppError.badRequest('TOTP is not enabled');
    }

    if (!user.passwordHash || !(await comparePassword(input.currentPassword, user.passwordHash))) {
      throw new IncorrectPasswordError();
    }

    const secret = decryptTotpSecret(user.totpSecret);
    if (!isValidTotpCode(secret, input.totpCode)) {
      throw TotpInvalidError();
    }

    await this.deps.userRepository.update(user.id, {
      totpSecret: null,
      totpEnabled: false,
    });

    await this.deps.audit?.record({
      actorId: user.id,
      action: 'auth.totp.disable',
      resource: 'user',
      resourceId: user.id,
    });
  }
}
