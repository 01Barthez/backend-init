import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import { assertNotLastAdmin, assertNotSelfTarget } from '../services/admin-guards';
import type { MailerPort } from '../services/mailer.port';
import type { RbacPort } from '../services/rbac.port';
import type { UserCachePort } from '../services/user-cache.port';

export type UpdateUserRoleDeps = {
  usersRepository: UsersRepositoryPort;
  rbac: RbacPort;
  userCache: UserCachePort;
  mailer: MailerPort;
  audit?: AuditPort;
};

export type UpdateUserRoleInput = {
  userId: string;
  roleSlug: string;
  actorId: string;
};

/**
 * Assigns a role slug to a user (admin operation) and notifies them.
 */
export class UpdateUserRoleCommand {
  constructor(private readonly deps: UpdateUserRoleDeps) {}

  async execute(input: UpdateUserRoleInput): Promise<void> {
    const { userId, roleSlug, actorId } = input;

    if (!userId || !roleSlug) {
      throw AppError.badRequest('Missing required field(s): userId, role');
    }

    assertNotSelfTarget(actorId, userId, 'change the role of');
    await assertNotLastAdmin(this.deps.rbac, userId, roleSlug);

    const user = await this.deps.usersRepository.findLookupById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    await this.deps.rbac.assignRole(userId, roleSlug);
    await this.deps.userCache.invalidate(userId, user.email);

    await this.deps.audit?.record({
      action: 'user.role_update',
      resource: 'user',
      resourceId: userId,
      metadata: { roleSlug },
    });

    const userFullName = `${user.lastName} ${user.firstName}`;
    this.deps.mailer
      .queue({
        to: user.email,
        subject: MAIL.ROLE_CHANGED_SUBJECT,
        template: 'role-changed',
        data: { name: userFullName, role: roleSlug, date: new Date() },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue role-changed email', { userId, error: error.message });
      });

    log.info('User role updated', { userId, newRole: roleSlug });
  }
}
