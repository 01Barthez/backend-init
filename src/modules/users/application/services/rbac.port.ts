/**
 * RBAC operations required by user administration (role assign).
 * Default adapter wraps `@/modules/rbac`.
 */
export interface RbacPort {
  assignRole(userId: string, roleSlug: string): Promise<void>;
}
