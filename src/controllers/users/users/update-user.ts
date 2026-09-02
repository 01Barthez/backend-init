import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';
import { uploadAvatar } from '../_utils/avatar-uploader';

const updateUserInfo = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const user = (req as any).user;
    const { firstName, lastName, phone } = req.body;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    if (req.file) {
      const profileUrl = await uploadAvatar(req.file);
      updateData.avatarUrl = profileUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
      },
    });

    await invalidateUserCache(user.id, updatedUser.email);

    log.info('User info updated', { userId: user.id });

    return response.ok(req, res, updatedUser, 'User info updated successfully');
  },
);

export default updateUserInfo;
