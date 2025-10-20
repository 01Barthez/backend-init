import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

//*& Update User Role
const update_user_role = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;
    const { role } = req.body;

    const validation = validateRequiredFields({ user_id, role }, ['user_id', 'role']);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    // Get user
    const user = await prisma.users.findFirst({
      where: { user_id: user_id, is_deleted: false },
    });

    if (!user) {
      return response.notFound(req, res, 'User not found');
    }

    // Update role (commented out until role field is added to Prisma schema)
    await prisma.users.update({
      where: { user_id: user_id },
      data: { role },
    });

    // Invalidate cache
    await invalidateUserCache(user_id, user.email);

    log.info('User role updated', { userId: user_id, newRole: role });

    return response.ok(req, res, null, 'User role updated successfully');
  },
);

export default update_user_role;
