import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { ClearAllUsersCommand } from '../../application/commands/clear-all-users.command';
import type { DeleteUserPermanentlyCommand } from '../../application/commands/delete-user-permanently.command';
import type { DeleteUserCommand } from '../../application/commands/delete-user.command';
import type { RestoreUserCommand } from '../../application/commands/restore-user.command';
import type { UpdateUserRoleCommand } from '../../application/commands/update-user-role.command';
import type { UpdateUserCommand } from '../../application/commands/update-user.command';
import type { ExportUsersQuery } from '../../application/queries/export-users.query';
import type { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query';
import type { ListUsersQuery } from '../../application/queries/list-users.query';
import type { SearchUsersQuery } from '../../application/queries/search-users.query';
import { UsersSerializer } from '../serializers/users.serializer';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export type UsersControllerDeps = {
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

/**
 * Thin Express handlers — extract HTTP concerns, call use cases, serialize.
 */
export function createUsersController(deps: UsersControllerDeps) {
  const listUsers = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, isVerified, isDeleted, page = '1', limit = '10' } = req.query;

    const result = await deps.listUsers.execute({
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 10,
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
      ...(isVerified !== undefined ? { isVerified: isVerified === 'true' } : {}),
      ...(isDeleted !== undefined ? { isDeleted: isDeleted === 'true' } : {}),
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
    const users = await deps.searchUsers.execute(req.query.search as string);
    return response.ok(req, res, users, 'Found users');
  });

  const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await deps.getUserById.execute(req.params.userId);
    return response.ok(req, res, UsersSerializer.publicUser(user), 'User found');
  });

  const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user;
    const file = req.file;

    const updated = await deps.updateUser.execute({
      userId: authUser?.id ?? '',
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatarFile: file
        ? {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          }
        : undefined,
    });

    return response.ok(
      req,
      res,
      UsersSerializer.profile(updated),
      'User info updated successfully',
    );
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

  const exportUsers = asyncHandler(async (_req: Request, res: Response) => {
    const result = await deps.exportUsers.execute();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    return res.send(result.csv);
  });

  const clearAllUsers = asyncHandler(async (req: Request, res: Response) => {
    await deps.clearAllUsers.execute();
    return response.ok(req, res, null, 'All users cleared successfully');
  });

  return {
    listUsers,
    searchUsers,
    getUserById,
    updateUser,
    updateUserRole,
    deleteUser,
    deleteUserPermanently,
    restoreUser,
    exportUsers,
    clearAllUsers,
  };
}

export type UsersController = ReturnType<typeof createUsersController>;
