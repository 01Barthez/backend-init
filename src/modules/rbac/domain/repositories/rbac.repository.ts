import type { RoleEntity, UserAuthContext } from '../types/rbac.types';

/**
 * Persistence port for roles, permissions, user-role links, and ACL rules.
 * Infrastructure provides the Prisma implementation.
 */
export interface RbacRepositoryPort {
  /** Idempotent bootstrap of system roles + permission catalogue. */
  seedSystemRolesAndPermissions(): Promise<void>;

  findRoleBySlug(slug: string): Promise<RoleEntity | null>;

  /** Upsert UserRole for the given role slug. No-op if the role is missing. */
  assignRole(userId: string, slug: string): Promise<void>;

  /**
   * Resolve effective permissions and role slugs for a user.
   * Merges role permissions with ACL allow/deny overrides.
   */
  getUserAuthContext(userId: string): Promise<UserAuthContext>;
}
