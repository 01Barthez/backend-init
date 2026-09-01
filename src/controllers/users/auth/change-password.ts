import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import log from '@/services/logging/logger';
import { compare_password, hash_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

const changePassword = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { current_password, new_password } = req.body;
    const user = (req as any).user;

    if (!user) {
      return response.unauthorized(req, res, 'User not authenticated');
    }

    const validation = validateRequiredFields(req.body, ['current_password', 'new_password']);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    const dbUser = await prisma.user.findFirst({
      where: { id: user.id, isDeleted: false },
    });

    if (!dbUser) {
      return response.notFound(req, res, 'User not found');
    }

    const isPasswordValid = await compare_password(current_password, dbUser.password || '');
    if (!isPasswordValid) {
      return response.forbidden(req, res, 'Current password is incorrect');
    }

    const hashedPassword = await hash_password(new_password);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await invalidateUserCache(user.id, dbUser.email);

    log.info('Password changed successfully', { userId: user.id });

    return response.ok(req, res, null, 'Password changed successfully');
  },
);

export default changePassword;
