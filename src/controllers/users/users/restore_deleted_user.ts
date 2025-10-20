import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& GEt One Users
const restore_deleted_user = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;

    if (!user_id) {
      return response.badRequest(req, res, 'User ID is required');
    }

    // Get user
    const user = await prisma.users.update({
      where: { user_id, is_deleted: true },
      data: {
        is_deleted: false,
      },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    return response.ok(req, res, user, `User Restored Successfully`);
  },
);

export default restore_deleted_user;
