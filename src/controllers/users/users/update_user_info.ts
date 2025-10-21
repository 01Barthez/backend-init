import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';
import { uploadAvatar } from '../_utils/avatarUploader';

const update_user_info = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const user = (req as any).user;
    const { first_name, last_name, phone } = req.body;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }
    // Build update data
    const updateData: any = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;

    // Handle avatar upload
    if (req.file) {
      const profile_url = await uploadAvatar(req.file);
      updateData.avatar_url = profile_url;
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { user_id: user.user_id },
      data: updateData,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
      },
    });

    // Invalidate cache
    await invalidateUserCache(user.user_id, updatedUser.email);

    log.info('User info updated', { userId: user.user_id });

    return response.ok(req, res, updatedUser, 'User info updated successfully');
  },
);

export default update_user_info;
