import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { TokenRepositoryPort } from '../../domain/repositories/token.repository';

export type RevokeSessionInput = {
  userId: string;
  familyId: string;
};

export type RevokeSessionDeps = {
  tokenRepository: TokenRepositoryPort;
  audit?: AuditPort;
};

/**
 * Revokes one refresh family belonging to the caller (other devices stay signed in).
 */
export class RevokeSessionCommand {
  constructor(private readonly deps: RevokeSessionDeps) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    if (!input.familyId) {
      throw AppError.badRequest('Session id is required');
    }

    const owns = await this.deps.tokenRepository.familyBelongsToUser(input.familyId, input.userId);
    if (!owns) {
      throw AppError.notFound('Session not found');
    }

    await this.deps.tokenRepository.revokeFamily(input.familyId, 'LOGOUT');

    await this.deps.audit?.record({
      actorId: input.userId,
      action: 'auth.session.revoke',
      resource: 'refresh_token',
      resourceId: input.familyId,
    });
  }
}
