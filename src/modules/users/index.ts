import type { Router } from 'express';

import type { UserEntity } from '@/modules/auth/domain/entities/user.entity';

import { ClearAllUsersCommand } from './application/commands/clear-all-users.command';
import { DeleteUserPermanentlyCommand } from './application/commands/delete-user-permanently.command';
import { DeleteUserCommand } from './application/commands/delete-user.command';
import { RestoreUserCommand } from './application/commands/restore-user.command';
import { UpdateUserRoleCommand } from './application/commands/update-user-role.command';
import { UpdateUserCommand } from './application/commands/update-user.command';
import { ExportUsersQuery } from './application/queries/export-users.query';
import { GetUserByIdQuery } from './application/queries/get-user-by-id.query';
import { ListUsersQuery } from './application/queries/list-users.query';
import { SearchUsersQuery } from './application/queries/search-users.query';
import type { AvatarUploaderPort } from './application/services/avatar-uploader.port';
import type { MailerPort } from './application/services/mailer.port';
import type { RbacPort } from './application/services/rbac.port';
import type { UserCachePort } from './application/services/user-cache.port';
import type { UsersRepositoryPort } from './domain/repositories/users.repository';
import { AvatarUploaderAdapter } from './infrastructure/providers/avatar-uploader.adapter';
import { createMailerAdapter, createRbacAdapter } from './infrastructure/providers/legacy-adapters';
import { UserCacheAdapter } from './infrastructure/providers/user-cache.adapter';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';
import {
  type UsersController,
  createUsersController,
} from './presentation/controllers/users.controller';
import { createUsersRoutes } from './presentation/routes/users.routes';

/**
 * Explicit dependencies for the users module.
 * Register these in `src/app/container` when the composition root lands.
 */
export type UsersModuleDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  avatarUploader: AvatarUploaderPort;
  mailer: MailerPort;
  rbac: RbacPort;
};

export type UsersModule = {
  deps: UsersModuleDeps;
  useCases: {
    listUsers: ListUsersQuery;
    getUserById: GetUserByIdQuery;
    searchUsers: SearchUsersQuery;
    exportUsers: ExportUsersQuery;
    updateUser: UpdateUserCommand;
    updateUserRole: UpdateUserRoleCommand;
    deleteUser: DeleteUserCommand;
    deleteUserPermanently: DeleteUserPermanentlyCommand;
    restoreUser: RestoreUserCommand;
    clearAllUsers: ClearAllUsersCommand;
  };
  controller: UsersController;
  router: Router;
};

/**
 * Builds default infrastructure adapters.
 * Override any key when wiring a test double or alternate provider.
 */
export function createDefaultUsersDeps(overrides: Partial<UsersModuleDeps> = {}): UsersModuleDeps {
  const usersRepository = overrides.usersRepository ?? new PrismaUsersRepository();
  const userCache = overrides.userCache ?? new UserCacheAdapter(usersRepository);
  const avatarUploader = overrides.avatarUploader ?? new AvatarUploaderAdapter();
  const mailer = overrides.mailer ?? createMailerAdapter();
  const rbac = overrides.rbac ?? createRbacAdapter();

  return {
    usersRepository,
    userCache,
    avatarUploader,
    mailer,
    rbac,
  };
}

/**
 * Composition root for the users bounded context.
 *
 * Container note:
 * ```ts
 * // src/app/container/index.ts (future)
 * const users = createUsersModule(createDefaultUsersDeps());
 * register('users.router', users.router);
 * ```
 */
export function createUsersModule(deps: UsersModuleDeps): UsersModule {
  const useCases = {
    listUsers: new ListUsersQuery(deps),
    getUserById: new GetUserByIdQuery(deps),
    searchUsers: new SearchUsersQuery(deps),
    exportUsers: new ExportUsersQuery(deps),
    updateUser: new UpdateUserCommand(deps),
    updateUserRole: new UpdateUserRoleCommand(deps),
    deleteUser: new DeleteUserCommand(deps),
    deleteUserPermanently: new DeleteUserPermanentlyCommand(deps),
    restoreUser: new RestoreUserCommand(deps),
    clearAllUsers: new ClearAllUsersCommand(deps),
  };

  const controller = createUsersController(useCases);
  const router = createUsersRoutes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired users Express router for route registration. */
export function createUsersRouter(overrides: Partial<UsersModuleDeps> = {}): Router {
  return createUsersModule(createDefaultUsersDeps(overrides)).router;
}

/** Default singleton controller — used by deprecated controller re-exports. */
const defaultUsersModule = createUsersModule(createDefaultUsersDeps());
export const usersHandlers = defaultUsersModule.controller;

// Public re-exports for consumers / tests
export type { UserEntity };
export type { UsersRepositoryPort } from './domain/repositories/users.repository';
export type {
  UserListFilters,
  UserListResult,
  UserPublicProfile,
} from './domain/types/users.types';
export { UserCacheKeys } from './infrastructure/cache/user-cache.keys';
export {
  AvatarUploaderAdapter,
  uploadAvatar,
} from './infrastructure/providers/avatar-uploader.adapter';
export { UserCacheAdapter } from './infrastructure/providers/user-cache.adapter';
export { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';
export { usersSchemas } from './presentation/schemas/users.schemas';
export { UsersSerializer } from './presentation/serializers/users.serializer';
