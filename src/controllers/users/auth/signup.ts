import type { Request, Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/mail/send-mail.service';
import log from '@/services/logging/logger';
import { getOtpExpirationDate } from '@/utils/otp/otp-expiration';
import generateOtp from '@/utils/otp/generate-otp';
import { hash_password } from '@/utils/password/hashPassword';
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';

import { uploadAvatar } from '../_utils/avatarUploader';

const signup = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
  const { email, password, firstName, lastName, phone, role } = req.body;

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
      role,
      otp: {
        code: userOtp || '000000',
        expireAt: otpExpireDate,
      },
    },
  });
  if (!newUser) return response.badRequest(req, res, 'failed to create user');

  const userFullName = `${lastName} ${firstName}`;
  let emailSent = false;

  send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
    date: now,
    name: userFullName,
    otp: userOtp,
  })
    .then(() => {
      emailSent = true;
      log.info('OTP email sent successfully', { email });
    })
    .catch((mailError: any) => {
      log.warn('Failed to send OTP email, but user was created successfully', {
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
      otp: {
        otpExpireDate,
      },
      emailSent,
    },
    'User created successfully',
  );
});

export default signup;
