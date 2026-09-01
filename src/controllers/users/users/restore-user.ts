import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

const restoreDeletedUser = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { userId } = req.params;

    if (!userId) {
      return response.badRequest(req, res, 'User ID is required');
    }

    const user = await prisma.user.update({
      where: { id: userId, isDeleted: true },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    return response.ok(req, res, user, 'User restored successfully');
  },
);

export default restoreDeletedUser;
