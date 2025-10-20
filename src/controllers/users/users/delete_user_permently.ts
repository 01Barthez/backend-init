import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

//*& Hard Delete User
const delete_user_permently = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;

    if (!user_id) {
      return response.badRequest(req, res, 'User ID is required');
    }

    // Get user
    const user = await prisma.users.findFirst({
      where: { user_id: user_id },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    // Soft delete
    await prisma.users.delete({
      where: { user_id: user_id },
    });

    // Invalidate cache
    await invalidateUserCache(user_id, user.email);

    log.info('User soft deleted', { userId: user_id });

    return response.ok(req, res, null, 'User deleted successfully');
  },
);

export default delete_user_permently;
