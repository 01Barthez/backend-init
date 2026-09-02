/**
 * Minimal RBAC port for ownership overrides (admin publish/update/delete).
 */
export interface BlogRbacPort {
  hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
}
