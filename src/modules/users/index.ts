import type { Router } from 'express';

import type { UserEntity } from '@/modules/auth/domain/entities/user.entity';
import { type AuditPort, auditRepository } from '@/shared/infrastructure/audit';

import { AdminUnlinkOAuthCommand } from './application/commands/admin-unlink-oauth.command';
import { ClearAllUsersCommand } from './application/commands/clear-all-users.command';
import { DeleteUserPermanentlyCommand } from './application/commands/delete-user-permanently.command';
import { DeleteUserCommand } from './application/commands/delete-user.command';
import { InviteUserCommand } from './application/commands/invite-user.command';
import { RestoreUserCommand } from './application/commands/restore-user.command';
import { RevokeUserSessionsCommand } from './application/commands/revoke-user-sessions.command';
import { SetUserActiveCommand } from './application/commands/set-user-active.command';
import { UnlockUserCommand } from './application/commands/unlock-user.command';
import { UpdateUserRoleCommand } from './application/commands/update-user-role.command';
import { UpdateUserCommand } from './application/commands/update-user.command';
import { VerifyUserEmailCommand } from './application/commands/verify-user-email.command';
import { ExportUsersQuery } from './application/queries/export-users.query';
import { GetUserByIdQuery } from './application/queries/get-user-by-id.query';
import { GetUserSessionsQuery } from './application/queries/get-user-sessions.query';
import { ListUsersQuery } from './application/queries/list-users.query';
import { SearchUsersQuery } from './application/queries/search-users.query';
import type { AvatarUploaderPort } from './application/services/avatar-uploader.port';
import type { MailerPort } from './application/services/mailer.port';
import type { RbacPort } from './application/services/rbac.port';
import type { SessionPort } from './application/services/session.port';
import type { UserCachePort } from './application/services/user-cache.port';
import type { UsersRepositoryPort } from './domain/repositories/users.repository';
import { AvatarUploaderAdapter } from './infrastructure/providers/avatar-uploader.adapter';
import {
  createListSessionsAdapter,
  createMailerAdapter,
  createRbacAdapter,
  createSessionAdapter,
  createUnlinkOAuthAdapter,
} from './infrastructure/providers/legacy-adapters';
import { UserCacheAdapter } from './infrastructure/providers/user-cache.adapter';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';
import {
  type UsersController,
  createUsersController,
} from './presentation/controllers/users.controller';
import { createUsersRoutes } from './presentation/routes/users.routes';

/**
 * Explicit dependencies for the users module.
 */
export type UsersModuleDeps = {
  usersRepository: UsersRepositoryPort;
  userCache: UserCachePort;
  avatarUploader: AvatarUploaderPort;
  mailer: MailerPort;
  rbac: RbacPort;
  session: SessionPort;
  audit?: AuditPort;
};

export type UsersModule = {
  deps: UsersModuleDeps;
  useCases: {
    listUsers: ListUsersQuery;
    getUserById: GetUserByIdQuery;
    getUserSessions: GetUserSessionsQuery;
    searchUsers: SearchUsersQuery;
    exportUsers: ExportUsersQuery;
    updateUser: UpdateUserCommand;
    updateUserRole: UpdateUserRoleCommand;
    deleteUser: DeleteUserCommand;
    deleteUserPermanently: DeleteUserPermanentlyCommand;
    restoreUser: RestoreUserCommand;
    setUserActive: SetUserActiveCommand;
    verifyUserEmail: VerifyUserEmailCommand;
    unlockUser: UnlockUserCommand;
    revokeUserSessions: RevokeUserSessionsCommand;
    inviteUser: InviteUserCommand;
    clearAllUsers: ClearAllUsersCommand;
    adminUnlinkOAuth: AdminUnlinkOAuthCommand;
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
  const session = overrides.session ?? createSessionAdapter();

  return {
    usersRepository,
    userCache,
    avatarUploader,
    mailer,
    rbac,
    session,
    audit: overrides.audit ?? auditRepository,
  };
}

/**
 * Composition root for the users bounded context.
 */
export function createUsersModule(deps: UsersModuleDeps): UsersModule {
  const useCases = {
    listUsers: new ListUsersQuery(deps),
    getUserById: new GetUserByIdQuery(deps),
    getUserSessions: new GetUserSessionsQuery({
      usersRepository: deps.usersRepository,
      listSessionsForUser: createListSessionsAdapter(),
      audit: deps.audit,
    }),
    searchUsers: new SearchUsersQuery(deps),
    exportUsers: new ExportUsersQuery(deps),
    updateUser: new UpdateUserCommand(deps),
    updateUserRole: new UpdateUserRoleCommand(deps),
    deleteUser: new DeleteUserCommand(deps),
    deleteUserPermanently: new DeleteUserPermanentlyCommand(deps),
    restoreUser: new RestoreUserCommand(deps),
    setUserActive: new SetUserActiveCommand(deps),
    verifyUserEmail: new VerifyUserEmailCommand(deps),
    unlockUser: new UnlockUserCommand(deps),
    revokeUserSessions: new RevokeUserSessionsCommand(deps),
    inviteUser: new InviteUserCommand(deps),
    clearAllUsers: new ClearAllUsersCommand(deps),
    adminUnlinkOAuth: new AdminUnlinkOAuthCommand({
      usersRepository: deps.usersRepository,
      unlinkOAuthAccount: createUnlinkOAuthAdapter(),
      audit: deps.audit,
    }),
  };

  const controller = createUsersController({
    listUsers: useCases.listUsers,
    getUserById: useCases.getUserById,
    getUserSessions: useCases.getUserSessions,
    searchUsers: useCases.searchUsers,
    exportUsers: useCases.exportUsers,
    updateUser: useCases.updateUser,
    updateUserRole: useCases.updateUserRole,
    deleteUser: useCases.deleteUser,
    deleteUserPermanently: useCases.deleteUserPermanently,
    restoreUser: useCases.restoreUser,
    setUserActive: useCases.setUserActive,
    verifyUserEmail: useCases.verifyUserEmail,
    unlockUser: useCases.unlockUser,
    revokeUserSessions: useCases.revokeUserSessions,
    inviteUser: useCases.inviteUser,
    adminUnlinkOAuth: useCases.adminUnlinkOAuth,
  });
  const router = createUsersRoutes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired users Express router for route registration. */
export function createUsersRouter(overrides: Partial<UsersModuleDeps> = {}): Router {
  return createUsersModule(createDefaultUsersDeps(overrides)).router;
}

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
