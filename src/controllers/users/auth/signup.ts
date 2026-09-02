import type { Request, Response } from 'express';

import prisma from '@/config/prisma/client';
import { MAIL } from '@/core/constants/mail.constants';
import rbacService from '@/services/auth/rbac.service';
import log from '@/services/logging/logger';
import { queueMail } from '@/services/mail/mail.service';
import generateOtp from '@/utils/otp/generate-otp';
import { getOtpExpirationDate } from '@/utils/otp/otp-expiration';
import { hash_password } from '@/utils/password/hash-password';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { uploadAvatar } from '../_utils/avatar-uploader';

const signup = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password, firstName, lastName, phone } = req.body;

  const validation = validateRequiredFields(req.body, [
    'email',
    'password',
    'firstName',
    'lastName',
    'phone',
  ]);

  if (!validation.valid) {
    return response.badRequest(
      req,
      res,
      `Missing required field(s): ${validation.missing.join(', ')}`,
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  if (existingUser) {
    return response.conflict(req, res, 'Email already exists');
  }

  const profileUrl = await uploadAvatar(req.file);
  const hashedPassword = await hash_password(password);
  const userOtp = generateOtp();
  const now = new Date();
  const otpExpireDate = getOtpExpirationDate(now);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword || '',
      firstName,
      lastName,
      phone,
      avatarUrl: profileUrl,
      otp: {
        code: userOtp || '000000',
        expireAt: otpExpireDate,
      },
    },
  });

  if (!newUser) return response.badRequest(req, res, 'failed to create user');

  await rbacService.assignDefaultRole(newUser.id);

  const userFullName = `${lastName} ${firstName}`;

  queueMail({
    to: email,
    subject: MAIL.OTP_SUBJECT,
    template: 'otp',
    data: { date: now, name: userFullName, otp: userOtp },
  }).catch((mailError: any) => {
    log.warn('Failed to queue OTP email, but user was created successfully', {
      email,
      error: mailError.message,
    });
  });

  log.info('User created successfully', { email });

  return response.created(
    req,
    res,
    {
      email,
      firstName,
      lastName,
      phone,
      profileUrl,
      otp: { otpExpireDate },
    },
    'User created successfully',
  );
});

export default signup;
