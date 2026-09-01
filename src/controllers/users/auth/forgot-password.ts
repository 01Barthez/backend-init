import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/mail/send-mail.service';
import userToken from '@/services/jwt/jwt.service';
import log from '@/services/logging/logger';
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

    const resetToken = userToken.generatePasswordResetToken(user.id);
    const resetLink = `${envs.CLIENT_URL}/reset-password?token=${resetToken}`;

    const userFullName = `${user.lastName} ${user.firstName}`;
    let emailSent = false;

    try {
      await send_mail(email, MAIL.RESET_PWD_SUBJECT, 'resetPassword', {
        name: userFullName,
        resetLink,
      });
      emailSent = true;
      log.info('Password reset email sent successfully', { email });
    } catch (mailError: any) {
      log.error('Failed to send password reset email', { email, error: mailError.message });
      return response.unprocessable(req, res, 'Failed to send password reset email');
    }

    return response.ok(
      req,
      res,
      { emailSent },
      'Password reset link sent to your email',
    );
  },
);

export default forgotPassword;
