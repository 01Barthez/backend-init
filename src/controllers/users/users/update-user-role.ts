import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

const updateUserRole = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { userId } = req.params;
    const { role } = req.body;

    const validation = validateRequiredFields({ userId, role }, ['userId', 'role']);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await invalidateUserCache(userId, user.email);

    log.info('User role updated', { userId, newRole: role });

    return response.ok(req, res, null, 'User role updated successfully');
  },
);

export default updateUserRole;
