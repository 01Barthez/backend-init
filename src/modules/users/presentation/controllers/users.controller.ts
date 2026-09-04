/**
 * Thin Express handlers — extract HTTP concerns, call use cases, serialize.
 */
import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { DeleteUserPermanentlyCommand } from '../../application/commands/delete-user-permanently.command';
import type { DeleteUserCommand } from '../../application/commands/delete-user.command';
import type { InviteUserCommand } from '../../application/commands/invite-user.command';
import type { RestoreUserCommand } from '../../application/commands/restore-user.command';
import type { RevokeUserSessionsCommand } from '../../application/commands/revoke-user-sessions.command';
import type { SetUserActiveCommand } from '../../application/commands/set-user-active.command';
import type { UnlockUserCommand } from '../../application/commands/unlock-user.command';
import type { UpdateUserRoleCommand } from '../../application/commands/update-user-role.command';
import type { UpdateUserCommand } from '../../application/commands/update-user.command';
import type { VerifyUserEmailCommand } from '../../application/commands/verify-user-email.command';
import type { AdminUnlinkOAuthCommand } from '../../application/commands/admin-unlink-oauth.command';
import type { ExportUsersQuery } from '../../application/queries/export-users.query';
import type { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query';
import type { GetUserSessionsQuery } from '../../application/queries/get-user-sessions.query';
import type { ListUsersQuery } from '../../application/queries/list-users.query';
import type { SearchUsersQuery } from '../../application/queries/search-users.query';
import { UsersSerializer } from '../serializers/users.serializer';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export type UsersControllerDeps = {
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
  adminUnlinkOAuth: AdminUnlinkOAuthCommand;
};

const parseBool = (value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  return value === 'true' || value === true;
};

const avatarFromRequest = (file?: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}) =>
  file
    ? {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }
    : undefined;

export function createUsersController(deps: UsersControllerDeps) {
  const listUsers = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, isVerified, isDeleted, search, page = '1', limit = '10' } = req.query;

    const result = await deps.listUsers.execute({
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10)),
      ...(parseBool(isActive) !== undefined ? { isActive: parseBool(isActive) } : {}),
      ...(parseBool(isVerified) !== undefined ? { isVerified: parseBool(isVerified) } : {}),
      ...(parseBool(isDeleted) !== undefined ? { isDeleted: parseBool(isDeleted) } : {}),
      ...(typeof search === 'string' && search.trim() ? { search: search.trim() } : {}),
    });

    return response.paginated(
      req,
      res,
      UsersSerializer.list(result),
      result.total,
      result.totalPages,
      result.page,
      'Users retrieved successfully',
    );
  });

  const searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, page = '1', limit = '20' } = req.query;
    const result = await deps.searchUsers.execute({
      search: (search as string) || '',
      page: Math.max(1, parseInt(page as string, 10) || 1),
      limit: Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20)),
    });

    return response.paginated(
      req,
      res,
      UsersSerializer.list(result),
      result.total,
      result.totalPages,
      result.page,
      'Found users',
    );
  });

  const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.getUserById.execute(req.params.userId);
    return response.ok(req, res, UsersSerializer.adminUser(user), 'User found');
  });

  const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user;
    const updated = await deps.updateUser.execute({
      userId: authUser?.id ?? '',
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatarFile: avatarFromRequest(req.file),
    });

    return response.ok(
      req,
      res,
      UsersSerializer.profile(updated),
      'User info updated successfully',
    );
  });

  const updateUserById = asyncHandler(async (req: Request, res: Response) => {
    const updated = await deps.updateUser.execute({
      userId: req.params.userId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatarFile: avatarFromRequest(req.file),
      clearAvatar: req.body.clearAvatar === true || req.body.clearAvatar === 'true',
    });

    return response.ok(req, res, UsersSerializer.profile(updated), 'User updated successfully');
  });

  const deleteAvatar = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user;
    const updated = await deps.updateUser.execute({
      userId: authUser?.id ?? '',
      clearAvatar: true,
    });
    return response.ok(req, res, UsersSerializer.profile(updated), 'Avatar removed');
  });

  const deleteOwnAccount = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user;
    await deps.deleteUser.execute(authUser?.id ?? '');
    return response.ok(req, res, null, 'Your account has been deleted');
  });

  const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    await deps.updateUserRole.execute({
      userId: req.params.userId,
      roleSlug: req.body.role,
    });
    return response.ok(req, res, null, 'User role updated successfully');
  });

  const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await deps.deleteUser.execute(req.params.userId);
    return response.ok(req, res, null, 'User deleted successfully');
  });

  const deleteUserPermanently = asyncHandler(async (req: Request, res: Response) => {
    await deps.deleteUserPermanently.execute(req.params.userId);
    return response.ok(req, res, null, 'User permanently deleted');
  });

  const restoreUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.restoreUser.execute(req.params.userId);
    return response.ok(req, res, UsersSerializer.restored(user), 'User restored successfully');
  });

  const activateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.setUserActive.execute(req.params.userId, true);
    return response.ok(req, res, UsersSerializer.adminUser(user), 'User activated');
  });

  const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.setUserActive.execute(req.params.userId, false);
    return response.ok(req, res, UsersSerializer.adminUser(user), 'User deactivated');
  });

  const verifyUserEmail = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.verifyUserEmail.execute(req.params.userId);
    return response.ok(req, res, UsersSerializer.adminUser(user), 'User email marked verified');
  });

  const unlockUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.unlockUser.execute(req.params.userId);
    return response.ok(req, res, UsersSerializer.adminUser(user), 'User unlocked');
  });

  const revokeUserSessions = asyncHandler(async (req: Request, res: Response) => {
    await deps.revokeUserSessions.execute(req.params.userId);
    return response.ok(req, res, null, 'All sessions revoked for user');
  });

  const adminUnlinkOAuth = asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).user;
    await deps.adminUnlinkOAuth.execute({
      actorId: actor?.id ?? '',
      targetUserId: req.params.userId,
      provider: req.params.provider,
    });
    return response.ok(req, res, null, `${req.params.provider} unlinked from user`);
  });

  const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).user;
    const sessions = await deps.getUserSessions.execute({
      actorId: actor?.id ?? '',
      targetUserId: req.params.userId,
    });
    return response.ok(req, res, sessions, 'User sessions retrieved');
  });

  const inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const invited = await deps.inviteUser.execute({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      roleSlug: req.body.role,
    });
    return response.created(req, res, invited, 'User invited successfully');
  });

  const exportUsers = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, isVerified, search } = req.query;
    const result = await deps.exportUsers.execute({
      ...(parseBool(isActive) !== undefined ? { isActive: parseBool(isActive) } : {}),
      ...(parseBool(isVerified) !== undefined ? { isVerified: parseBool(isVerified) } : {}),
      ...(typeof search === 'string' && search.trim() ? { search: search.trim() } : {}),
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    return res.send(result.csv);
  });

  return {
    listUsers,
    searchUsers,
    getUserById,
    getUserSessions,
    adminUnlinkOAuth,
    updateUser,
    updateUserById,
    deleteAvatar,
    deleteOwnAccount,
    updateUserRole,
    deleteUser,
    deleteUserPermanently,
    restoreUser,
    activateUser,
    deactivateUser,
    verifyUserEmail,
    unlockUser,
    revokeUserSessions,
    inviteUser,
    exportUsers,
  };
}

export type UsersController = ReturnType<typeof createUsersController>;
