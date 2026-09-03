import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { UserRepositoryPort } from '../../domain/repositories/user.repository';
import { buildTotpUri, createTotpSecret, encryptTotpSecret } from '../services/totp';

export type EnrollTotpInput = {
  userId: string;
};

export type EnrollTotpResult = {
  otpauthUrl: string;
  /** Shown once so the user can add the account without a QR scanner. */
  secret: string;
};

export type EnrollTotpDeps = {
  userRepository: UserRepositoryPort;
  audit?: AuditPort;
};

/**
 * Starts TOTP enrollment. The secret is stored encrypted with totpEnabled=false
 * until ConfirmTotpCommand verifies a code from the authenticator app.
 */
export class EnrollTotpCommand {
  constructor(private readonly deps: EnrollTotpDeps) {}

  async execute(input: EnrollTotpInput): Promise<EnrollTotpResult> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.totpEnabled) {
      throw AppError.conflict('TOTP is already enabled');
    }

    const secret = createTotpSecret();
    await this.deps.userRepository.update(user.id, {
      totpSecret: encryptTotpSecret(secret),
      totpEnabled: false,
    });

    await this.deps.audit?.record({
      actorId: user.id,
      action: 'auth.totp.enroll',
      resource: 'user',
      resourceId: user.id,
    });

    return {
      otpauthUrl: buildTotpUri(user.email, secret),
      secret,
    };
  }
}
