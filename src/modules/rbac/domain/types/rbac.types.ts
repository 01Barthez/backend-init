/**
 * RBAC domain types — no Prisma / Express imports.
 */

export type UserAuthContext = {
  permissions: string[];
  roles: string[];
};

export type RoleEntity = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
};

export type PermissionEntity = {
  id: string;
  name: string;
  resource: string;
  action: string;
  isSystem: boolean;
};
