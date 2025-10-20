import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& GEt One Users
const get_user_by_id = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;

    if (!user_id) {
      return response.badRequest(req, res, 'User ID is required');
    }

    // Get user
    const user = await prisma.users.findFirst({
      where: { user_id, is_deleted: false },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        is_verified: true,
        email_verified_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    return response.ok(req, res, user, `User Found`);
  },
);

export default get_user_by_id;
