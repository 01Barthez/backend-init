import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { hash_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { invalidateUserCache } from '../_cache/user-cache';

//& Reset Password
const reset_password = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { resetToken } = req.params;
    const { new_password } = req.body;

    const validation = validateRequiredFields({ resetToken, new_password }, [
      'resetToken',
      'new_password',
    ]);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    try {
      // Verify reset token
      const decoded = userToken.verifyPasswordResetToken(resetToken);
      const userId = decoded.userId;

      // Get user
      const user = await prisma.users.findFirst({
        where: { user_id: userId, is_deleted: false },
      });

      if (!user) {
        return response.notFound(req, res, 'User not found');
      }

      // Hash new password
      const hashedPassword = await hash_password(new_password);

      // Update password
      await prisma.users.update({
        where: { user_id: userId },
        data: { password: hashedPassword },
      });

      // Invalidate cache
      await invalidateUserCache(userId, user.email);

      log.info('Password reset successfully', { userId });

      return response.ok(req, res, null, 'Password reset successfully');
    } catch (error: any) {
      log.error('Password reset failed', { error: error.message });
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return response.unprocessable(req, res, 'Invalid or expired reset token');
      }
      return response.serverError(req, res, 'Failed to reset password', error);
    }
  },
);

export default reset_password;
