import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
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

    const userFullName = `${user.lastName} ${user.firstName}`;
    queueMail({
      to: user.email,
      subject: MAIL.ACCOUNT_DELETED_SUBJECT,
      template: 'account-deleted',
      data: { name: userFullName, date: new Date() },
    }).catch((error) => {
      log.warn('Failed to queue account-deleted email', { userId, error: error.message });
    });

    log.info('User soft deleted', { userId });

    return response.ok(req, res, null, 'User deleted successfully');
  },
);

export default deleteUser;
