import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import jwtService from '@/services/auth/jwt.service';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import { asyncHandler, response } from '@/utils/responses/helpers';

const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) {
      return response.badRequest(req, res, 'Email is required');
    }

    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) {
      return response.ok(
        req,
        res,
        { emailSent: true },
        'If email exists, password reset link has been sent',
      );
    }

    const resetToken = jwtService.generatePasswordResetToken(user.id);
    const resetLink = `${envs.CLIENT_URL}/reset-password?token=${resetToken}`;

    const userFullName = `${user.lastName} ${user.firstName}`;

    try {
      await queueMail({
        to: email,
        subject: MAIL.RESET_PWD_SUBJECT,
        template: 'reset-password',
        data: { name: userFullName, resetLink },
      });
      log.info('Password reset email queued', { email });
    } catch (mailError: any) {
      log.error('Failed to queue password reset email', { email, error: mailError.message });
      return response.unprocessable(req, res, 'Failed to send password reset email');
    }

    return response.ok(req, res, { emailSent: true }, 'Password reset link sent to your email');
  },
);

export default forgotPassword;
