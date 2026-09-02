/**
 * RBAC port used by auth (login context + default role on signup).
 * Default adapter wraps `@/modules/rbac`.
 */
export interface RbacPort {
  getUserAuthContext(userId: string): Promise<{ permissions: string[]; roles: string[] }>;
  assignDefaultRole(userId: string, slug?: string): Promise<void>;
}
