/**
 * Application composition root — Dependency Injection container.
 *
 * Modules declare ports; this file wires concrete adapters once.
 * Tests can call `createContainer({ ...overrides })` with fakes.
 *
 * Design goals for an open-source template:
 * - Explicit, readable wiring (no hidden magic)
 * - Easy to swap Prisma → another DB adapter per module
 * - No framework lock-in (plain factories, not a DI framework)
 */
import { type AuthModule, createAuthModule, createDefaultAuthDeps } from '@/modules/auth';
import { type BlogModule, createBlogModule, createDefaultBlogDeps } from '@/modules/blog';
import { type FilesModule, createDefaultFilesDeps, createFilesModule } from '@/modules/files';
import { type OAuthModule, createDefaultOAuthDeps, createOAuthModule } from '@/modules/oauth';
import { type RbacModule, createDefaultRbacDeps, createRbacModule } from '@/modules/rbac';
import { type SystemRouters, createSystemRouters } from '@/modules/system';
import { type UsersModule, createDefaultUsersDeps, createUsersModule } from '@/modules/users';

export type AppContainer = {
  auth: AuthModule;
  users: UsersModule;
  rbac: RbacModule;
  blog: BlogModule;
  oauth: OAuthModule;
  files: FilesModule;
  system: SystemRouters;
};

export type ContainerOverrides = {
  auth?: Parameters<typeof createDefaultAuthDeps>[0];
  users?: Parameters<typeof createDefaultUsersDeps>[0];
  rbac?: Parameters<typeof createDefaultRbacDeps>[0];
  blog?: Parameters<typeof createDefaultBlogDeps>[0];
  oauth?: Parameters<typeof createDefaultOAuthDeps>[0];
  files?: Parameters<typeof createDefaultFilesDeps>[0];
};

/**
 * Build the full application graph.
 * Call once at boot; pass overrides in tests.
 */
export function createContainer(overrides: ContainerOverrides = {}): AppContainer {
  // RBAC first — auth and users depend on permission lookups.
  const rbac = createRbacModule(createDefaultRbacDeps(overrides.rbac));

  const auth = createAuthModule(createDefaultAuthDeps(overrides.auth));
  const users = createUsersModule(createDefaultUsersDeps(overrides.users));
  const blog = createBlogModule(createDefaultBlogDeps(overrides.blog));
  const oauth = createOAuthModule(createDefaultOAuthDeps(overrides.oauth));
  const files = createFilesModule(createDefaultFilesDeps(overrides.files));
  const system = createSystemRouters();

  return { auth, users, rbac, blog, oauth, files, system };
}

/** Singleton used by the HTTP process. Prefer `createContainer` in tests. */
let singleton: AppContainer | null = null;

export function getContainer(): AppContainer {
  if (!singleton) {
    singleton = createContainer();
  }
  return singleton;
}

export function resetContainer(): void {
  singleton = null;
}
