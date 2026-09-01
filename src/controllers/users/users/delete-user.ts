import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

const deleteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { userId } = req.params;

    if (!userId) {
      return response.badRequest(req, res, 'User ID is required');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await invalidateUserCache(userId, user.email);

    log.info('User soft deleted', { userId });

    return response.ok(req, res, null, 'User deleted successfully');
  },
);

export default deleteUser;
