import { AppError } from '@/shared/domain/errors/app-error';
import { TotpInvalidError } from '@/shared/domain/errors/security.errors';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import { decryptTotpSecret, isValidTotpCode } from '../services/totp';

export type ConfirmTotpInput = {
  userId: string;
  totpCode: string;
};

export type ConfirmTotpDeps = {
  userRepository: UserRepositoryPort;
  audit?: AuditPort;
};

/**
 * Confirms enrollment with a code from the authenticator app, then enables TOTP.
 */
export class ConfirmTotpCommand {
  constructor(private readonly deps: ConfirmTotpDeps) {}

  async execute(input: ConfirmTotpInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user?.totpSecret) {
      throw AppError.badRequest('TOTP enrollment has not been started');
    }

    const secret = decryptTotpSecret(user.totpSecret);
    if (!isValidTotpCode(secret, input.totpCode)) {
      throw TotpInvalidError();
    }

    await this.deps.userRepository.update(user.id, { totpEnabled: true });

    await this.deps.audit?.record({
      actorId: user.id,
      action: 'auth.totp.confirm',
      resource: 'user',
      resourceId: user.id,
    });
  }
}
