/**
 * Minimal RBAC port for ownership overrides (admin publish/update/delete).
 */
export interface BlogRbacPort {
  hasPermission(userId: string, permission: string): Promise<boolean>;
}
