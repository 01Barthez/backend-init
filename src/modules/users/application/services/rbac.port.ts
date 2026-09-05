/**
 * RBAC operations required by user administration.
 * Default adapter wraps `@/modules/rbac`.
 */
export interface RbacPort {
  assignRole(userId: string, roleSlug: string): Promise<void>;

  /** Role slugs currently assigned to the user. */
  getRoles(userId: string): Promise<string[]>;

  hasPermission(userId: string, permission: string): Promise<boolean>;

  /** Distinct users holding any of the given role slugs. */
  countUsersWithAnyRole(slugs: string[]): Promise<number>;
}
