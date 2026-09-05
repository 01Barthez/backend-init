/**
 * Explicit dependencies for the rbac module.
 * Register these in `src/app/container` when the composition root lands.
 */
import { SYSTEM_ROLES } from '@/shared/constants/app.constants';

import { AssignRoleCommand } from './application/commands/assign-role.command';
import { SeedSystemRolesCommand } from './application/commands/seed-system-roles.command';
import { GetUserAuthContextQuery } from './application/queries/get-user-auth-context.query';
import { permissionSatisfied } from './domain/permission-match';
import type { RbacRepositoryPort } from './domain/repositories/rbac.repository';
import type { UserAuthContext } from './domain/types/rbac.types';
import {
  getCachedUserAuthContext,
  invalidateAuthContext,
} from './infrastructure/cache/auth-context.cache';
import { PrismaRbacRepository } from './infrastructure/repositories/prisma-rbac.repository';

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
  /** Count distinct users holding any of the given role slugs. */
  countUsersWithAnyRole(slugs: string[]): Promise<number>;
  invalidateAuthContext(userId: string): Promise<void>;
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

  const service = createRbacServiceFacade(useCases, deps);

  return { deps, useCases, service };
}

type RbacUseCases = RbacModule['useCases'];

/**
 * Facade used by middlewares, bootstrap, and legacy imports.
 * Prefer injecting use cases in new module code.
 */
function createRbacServiceFacade(useCases: RbacUseCases, deps: RbacModuleDeps) {
  const loadAuthContext = (userId: string): Promise<UserAuthContext> =>
    getCachedUserAuthContext(userId, () => useCases.getUserAuthContext.execute(userId));

  return {
    async seedSystemRolesAndPermissions(): Promise<void> {
      await useCases.seedSystemRoles.execute();
    },

    async assignDefaultRole(userId: string, slug: string = SYSTEM_ROLES.USER): Promise<void> {
      await useCases.assignRole.execute({ userId, roleSlug: slug, requireExists: false });
      await invalidateAuthContext(userId);
    },

    async assignRole(userId: string, roleSlug: string): Promise<void> {
      await useCases.assignRole.execute({ userId, roleSlug, requireExists: true });
      await invalidateAuthContext(userId);
    },

    async getUserAuthContext(userId: string): Promise<UserAuthContext> {
      return loadAuthContext(userId);
    },

    async hasPermission(userId: string, permission: string): Promise<boolean> {
      const ctx = await loadAuthContext(userId);
      if (ctx.roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return true;
      return permissionSatisfied(ctx.permissions, permission);
    },

    async hasAnyRole(userId: string, slugs: string[]): Promise<boolean> {
      const ctx = await loadAuthContext(userId);
      return slugs.some((slug) => ctx.roles.includes(slug));
    },

    async countUsersWithAnyRole(slugs: string[]): Promise<number> {
      return deps.rbacRepository.countUsersWithAnyRole(slugs);
    },

    async invalidateAuthContext(userId: string): Promise<void> {
      await invalidateAuthContext(userId);
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
export { permissionSatisfied } from './domain/permission-match';
export type { RbacRepositoryPort } from './domain/repositories/rbac.repository';
export type { PermissionEntity, RoleEntity, UserAuthContext } from './domain/types/rbac.types';
export { invalidateAuthContext } from './infrastructure/cache/auth-context.cache';
export { PrismaRbacRepository } from './infrastructure/repositories/prisma-rbac.repository';
