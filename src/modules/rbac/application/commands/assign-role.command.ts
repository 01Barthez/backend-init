import { AppError } from '@/shared/domain/errors/app-error';

import type { RbacRepositoryPort } from '../../domain/repositories/rbac.repository';

export type AssignRoleDeps = {
  rbacRepository: RbacRepositoryPort;
};

export type AssignRoleInput = {
  userId: string;
  /** Role slug (e.g. SYSTEM_ROLES.USER). */
  roleSlug: string;
  /** When true, missing roles throw; when false, no-op (default-role on signup). */
  requireExists?: boolean;
};

/**
 * Links a user to a role by slug.
 * Used both for admin role assignment and default role on signup.
 */
export class AssignRoleCommand {
  constructor(private readonly deps: AssignRoleDeps) {}

  async execute(input: AssignRoleInput): Promise<void> {
    const { userId, roleSlug, requireExists = false } = input;

    if (!userId || !roleSlug) {
      throw AppError.badRequest('Missing required field(s): userId, roleSlug');
    }

    const role = await this.deps.rbacRepository.findRoleBySlug(roleSlug);
    if (!role) {
      if (requireExists) {
        throw AppError.badRequest(`Unknown role: ${roleSlug}`);
      }
      return;
    }

    await this.deps.rbacRepository.assignRole(userId, roleSlug);
  }
}
