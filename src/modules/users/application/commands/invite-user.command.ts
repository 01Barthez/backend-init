import { envs } from '@/app/config';
import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { MAIL } from '@/shared/constants/mail.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';
import { hashPassword } from '@/shared/utils/crypto';
import { randomHex } from '@/shared/utils/crypto/random-hex';

import type { UsersRepositoryPort } from '../../domain/repositories/users.repository';
import type { InviteUserInput, InviteUserResult } from '../dto/users.dto';
import type { MailerPort } from '../services/mailer.port';
import type { RbacPort } from '../services/rbac.port';
import type { SessionPort } from '../services/session.port';
import type { UserCachePort } from '../services/user-cache.port';

export type InviteUserDeps = {
  usersRepository: UsersRepositoryPort;
  rbac: RbacPort;
  session: SessionPort;
  mailer: MailerPort;
  userCache: UserCachePort;
  audit?: AuditPort;
};

const ASSIGNABLE = [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.USER, SYSTEM_ROLES.GUEST] as const;

/**
 * Admin invite: create a verified+active user, assign a role, email a set-password link.
 * Password is a random hash placeholder — the invitee sets their own via reset token.
 */
export class InviteUserCommand {
  constructor(private readonly deps: InviteUserDeps) {}

  async execute(input: InviteUserInput): Promise<InviteUserResult> {
    const email = input.email?.toLowerCase().trim();
    const { firstName, lastName, phone } = input;
    const roleSlug = input.roleSlug?.trim() || SYSTEM_ROLES.USER;

    if (!email || !firstName || !lastName) {
      throw AppError.badRequest('Missing required field(s): email, firstName, lastName');
    }

    if (!(ASSIGNABLE as readonly string[]).includes(roleSlug)) {
      throw AppError.badRequest(`Invalid role. Must be one of: ${ASSIGNABLE.join(', ')}`);
    }

    const existing = await this.deps.usersRepository.findLookupByEmail(email);
    if (existing) {
      throw AppError.conflict('A user with this email already exists');
    }

    const passwordHash = await hashPassword(randomHex(24));
    const user = await this.deps.usersRepository.createInvited({
      email,
      firstName,
      lastName,
      phone,
      passwordHash,
    });

    await this.deps.rbac.assignRole(user.id, roleSlug);

    const resetToken = await this.deps.session.createPasswordResetToken(user.id);
    const inviteLink = `${envs.CLIENT_URL}/reset-password?token=${resetToken}`;
    const userFullName = `${lastName} ${firstName}`;

    this.deps.mailer
      .queue({
        to: email,
        subject: MAIL.USER_INVITED_SUBJECT,
        template: 'user-invited',
        data: {
          name: userFullName,
          inviteLink,
          role: roleSlug,
          date: new Date(),
        },
      })
      .catch((error: Error) => {
        log.warn('Failed to queue user-invited email', { userId: user.id, error: error.message });
      });

    await this.deps.userCache.invalidate(user.id, email);

    await this.deps.audit?.record({
      action: 'user.invite',
      resource: 'user',
      resourceId: user.id,
      metadata: { roleSlug },
    });

    log.info('User invited', { userId: user.id, roleSlug });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleSlug,
    };
  }
}
