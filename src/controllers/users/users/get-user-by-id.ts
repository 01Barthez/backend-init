import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { asyncHandler, response } from '@/utils/responses/helpers';

const getUserById = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { userId } = req.params;

    if (!userId) {
      return response.badRequest(req, res, 'User ID is required');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        isVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    return response.ok(req, res, user, 'User found');
  },
);

export default getUserById;
