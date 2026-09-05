import type { RoleEntity, UserAuthContext } from '../types/rbac.types';

/**
 * Persistence port for roles, permissions, user-role links, and ACL rules.
 * Infrastructure provides the Prisma implementation.
 */
export interface RbacRepositoryPort {
  /** Idempotent bootstrap of system roles + permission catalogue. */
  seedSystemRolesAndPermissions(): Promise<void>;

  findRoleBySlug(slug: string): Promise<RoleEntity | null>;

  /**
   * Replace the user's role membership with a single role (no stacking).
   * No-op if the role slug is missing.
   */
  assignRole(userId: string, slug: string): Promise<void>;

  /** Count users that currently hold the given role slug (active role row). */
  countUsersWithRole(slug: string): Promise<number>;

  /**
   * Resolve effective permissions and role slugs for a user.
   */
  getUserAuthContext(userId: string): Promise<UserAuthContext>;

  /** Distinct users that currently hold any of the given role slugs. */
  countUsersWithAnyRole(slugs: string[]): Promise<number>;
}
