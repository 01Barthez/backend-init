import { SYSTEM_ROLES } from '@/shared/constants/app.constants';

import { AssignRoleCommand } from './application/commands/assign-role.command';
import { SeedSystemRolesCommand } from './application/commands/seed-system-roles.command';
import { GetUserAuthContextQuery } from './application/queries/get-user-auth-context.query';
import { permissionSatisfied } from './domain/permission-match';
import type { RbacRepositoryPort } from './domain/repositories/rbac.repository';
import type { UserAuthContext } from './domain/types/rbac.types';
import { PrismaRbacRepository } from './infrastructure/repositories/prisma-rbac.repository';

/**
 * Explicit dependencies for the rbac module.
 * Register these in `src/app/container` when the composition root lands.
 */
export type RbacModuleDeps = {
  rbacRepository: RbacRepositoryPort;
};

/** Compatibility facade matching the legacy `rbacService` shape. */
export type RbacService = {
  seedSystemRolesAndPermissions(): Promise<void>;
  assignDefaultRole(userId: string, slug?: string): Promise<void>;
  /** Admin assign — throws when the role slug is unknown. */
  assignRole(userId: string, roleSlug: string): Promise<void>;
  getUserAuthContext(userId: string): Promise<UserAuthContext>;
  hasPermission(userId: string, permission: string): Promise<boolean>;
  hasAnyRole(userId: string, slugs: string[]): Promise<boolean>;
  canAccessResource(userId: string, permission: string, resourceOwnerId?: string): Promise<boolean>;
};

export type RbacModule = {
  deps: RbacModuleDeps;
  useCases: {
    getUserAuthContext: GetUserAuthContextQuery;
    seedSystemRoles: SeedSystemRolesCommand;
    assignRole: AssignRoleCommand;
  };
  service: RbacService;
};

export function createDefaultRbacDeps(overrides: Partial<RbacModuleDeps> = {}): RbacModuleDeps {
  return {
    rbacRepository: overrides.rbacRepository ?? new PrismaRbacRepository(),
  };
}

/**
 * Composition root for the RBAC bounded context.
 */
export function createRbacModule(deps: RbacModuleDeps): RbacModule {
  const useCases = {
    getUserAuthContext: new GetUserAuthContextQuery(deps),
    seedSystemRoles: new SeedSystemRolesCommand(deps),
    assignRole: new AssignRoleCommand(deps),
  };

  const service = createRbacServiceFacade(useCases);

  return { deps, useCases, service };
}

type RbacUseCases = RbacModule['useCases'];

/**
 * Facade used by middlewares, bootstrap, and legacy imports.
 * Prefer injecting use cases in new module code.
 */
function createRbacServiceFacade(useCases: RbacUseCases) {
  return {
    async seedSystemRolesAndPermissions(): Promise<void> {
      await useCases.seedSystemRoles.execute();
    },

    async assignDefaultRole(userId: string, slug: string = SYSTEM_ROLES.USER): Promise<void> {
      await useCases.assignRole.execute({ userId, roleSlug: slug, requireExists: false });
    },

    async assignRole(userId: string, roleSlug: string): Promise<void> {
      await useCases.assignRole.execute({ userId, roleSlug, requireExists: true });
    },

    async getUserAuthContext(userId: string): Promise<UserAuthContext> {
      return useCases.getUserAuthContext.execute(userId);
    },

    async hasPermission(userId: string, permission: string): Promise<boolean> {
      const ctx = await useCases.getUserAuthContext.execute(userId);
      if (ctx.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;
      return permissionSatisfied(ctx.permissions, permission);
    },

    async hasAnyRole(userId: string, slugs: string[]): Promise<boolean> {
      const ctx = await useCases.getUserAuthContext.execute(userId);
      return slugs.some((slug) => ctx.roles.includes(slug));
    },

    /**
     * Optional helper for use cases that need ownership + `:own`/`:any` elevation.
     * Route gates use `requirePermission`; keep resource IDOR checks in commands.
     */
    async canAccessResource(
      userId: string,
      permission: string,
      resourceOwnerId?: string,
    ): Promise<boolean> {
      const ctx = await useCases.getUserAuthContext.execute(userId);
      if (ctx.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;
      if (permission.endsWith(':own')) {
        if (ctx.permissions.includes(permission.replace(/:own$/, ':any'))) return true;
        return resourceOwnerId === userId && ctx.permissions.includes(permission);
      }
      return permissionSatisfied(ctx.permissions, permission);
    },
  };
}

/** Default singleton — preserves historical `rbacService` import sites. */
const defaultModule = createRbacModule(createDefaultRbacDeps());

export const rbacService = defaultModule.service;
export default rbacService;

export { AssignRoleCommand } from './application/commands/assign-role.command';
export { SeedSystemRolesCommand } from './application/commands/seed-system-roles.command';
export { GetUserAuthContextQuery } from './application/queries/get-user-auth-context.query';
export type { RbacRepositoryPort } from './domain/repositories/rbac.repository';
export type { PermissionEntity, RoleEntity, UserAuthContext } from './domain/types/rbac.types';
export { permissionSatisfied } from './domain/permission-match';
export { PrismaRbacRepository } from './infrastructure/repositories/prisma-rbac.repository';
