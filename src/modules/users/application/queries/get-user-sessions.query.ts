import type { AuthSessionSummary } from '@/modules/auth/domain/types/auth.types';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';

export type GetUserSessionsDeps = {
  usersRepository: UsersRepositoryPort;
  /** Token repository from auth — used to read session families. */
  listSessionsForUser: (userId: string) => Promise<AuthSessionSummary[]>;
  audit?: AuditPort;
};

export type GetUserSessionsInput = {
  actorId: string;
  targetUserId: string;
};

/**
 * Admin query: list all refresh-token session families for any user.
 * The actual session data lives in the auth token repository; this command
 * just validates that the target user exists and delegates to the port.
 */
export class GetUserSessionsQuery {
  constructor(private readonly deps: GetUserSessionsDeps) {}

  async execute(input: GetUserSessionsInput): Promise<AuthSessionSummary[]> {
    const user = await this.deps.usersRepository.findLookupById(input.targetUserId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const sessions = await this.deps.listSessionsForUser(input.targetUserId);

    await this.deps.audit?.record({
      actorId: input.actorId,
      action: 'user.sessions.view',
      resource: 'user',
      resourceId: input.targetUserId,
    });

    return sessions;
  }
}
