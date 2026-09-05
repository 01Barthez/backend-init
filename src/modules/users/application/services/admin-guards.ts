import { SYSTEM_ROLES } from '@/shared/constants/app.constants';
import { AppError } from '@/shared/domain/errors/app-error';

import type { RbacPort } from '../services/rbac.port';

const ADMIN_SLUGS = [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPER_ADMIN] as const;

export const assertNotSelfTarget = (actorId: string, targetId: string, action: string): void => {
  if (actorId && targetId && actorId === targetId) {
    throw AppError.forbidden(`Cannot ${action} your own account`);
  }
};

/**
 * Blocks demotion/removal when the target is the last admin/super-admin.
 * `nextRoleSlug` — when set (role update), allow staying within admin ranks.
 */
export const assertNotLastAdmin = async (
  rbac: RbacPort,
  targetUserId: string,
  nextRoleSlug?: string,
): Promise<void> => {
  const roles = await rbac.getRoles(targetUserId);
  const isAdmin = roles.some((slug) => (ADMIN_SLUGS as readonly string[]).includes(slug));
  if (!isAdmin) return;

  if (nextRoleSlug && (ADMIN_SLUGS as readonly string[]).includes(nextRoleSlug)) {
    return;
  }

  const adminCount = await rbac.countUsersWithAnyRole([...ADMIN_SLUGS]);
  if (adminCount <= 1) {
    throw AppError.forbidden('Cannot remove or demote the last admin');
  }
};
