import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Forgot Password
const forgot_password = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) {
      return response.badRequest(req, res, 'Email is required');
    }

    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });

    if (!user) {
      return response.ok(
        req,
        res,
        { email_sent: true },
        'If email exists, password reset link has been sent',
      );
    }

    // Generate password reset token
    const resetToken = userToken.generatePasswordResetToken(user.user_id);
    const resetLink = `${envs.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    const user_full_name = `${user.last_name} ${user.first_name}`;
    let emailSent = false;

    try {
      await send_mail(email, MAIL.RESET_PWD_SUBJECT, 'resetPassword', {
        name: user_full_name,
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
      { email_sent: emailSent },
      'Password reset link sent to your email',
    );
  },
);

export default forgot_password;
