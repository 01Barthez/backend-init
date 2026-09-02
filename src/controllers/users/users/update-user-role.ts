import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
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

    const roleRecord = await prisma.role.findUnique({ where: { slug: role } });
    if (!roleRecord) {
      return response.badRequest(req, res, `Unknown role: ${role}`);
    }

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: roleRecord.id } },
      create: { userId, roleId: roleRecord.id },
      update: {},
    });

    await invalidateUserCache(userId, user.email);

    const userFullName = `${user.lastName} ${user.firstName}`;
    queueMail({
      to: user.email,
      subject: MAIL.ROLE_CHANGED_SUBJECT,
      template: 'role-changed',
      data: { name: userFullName, role, date: new Date() },
    }).catch((error) => {
      log.warn('Failed to queue role-changed email', { userId, error: error.message });
    });

    log.info('User role updated', { userId, newRole: role });

    return response.ok(req, res, null, 'User role updated successfully');
  },
);

export default updateUserRole;
