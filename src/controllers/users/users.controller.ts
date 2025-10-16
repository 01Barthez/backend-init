import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { uploader } from '@/config/minio/minio';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import log from '@/services/logging/logger';
import { get_expire_date } from '@/utils/Otp/OTPExpirationDate';
import generate_otp from '@/utils/Otp/generateOtp';
import { compare_password, hash_password } from '@/utils/password/hashPassword';
import { response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';
import userToken from '@/services/jwt/functions-jwt';
import blackListAccessAndRefresToken from '@/services/jwt/black_list_access_&_refresh_tokens';

// Object to regroups all our controllers
const users_controller = {
  //* AUTH SETUP **********************************************************************************************************************************************************
  //*& Insciption (Sign up)
  signup: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check all information are provided
    const missingFields = [];

    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!first_name) missingFields.push('first name');
    if (!last_name) missingFields.push('last name');
    if (!phone) missingFields.push('phone');

    if (missingFields.length > 0) {
      const errorMessage = `missing field(s) : ${missingFields.join(', ')}`;
      return response.badRequest(req, res, errorMessage);
    }

    // make sure email is unique
    const emailAlreadyExist = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    if (emailAlreadyExist) return response.conflict(req, res, 'Email already exist !');

    // Upload image to storage and save image
    let profile_url = '';

    if (req.file) {
      try {
        const profile = await uploader.uploadBuffer(req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
        });

        if (profile?.key) {
          // fetch the url of the storage file only if upload was successful
          profile_url = `http${envs.MINIO_USE_SSL ? 's' : ''}://localhost${[80, 443].includes(Number(envs.MINIO_PORT)) ? '' : `:${envs.MINIO_PORT}`}/${envs.MINIO_APP_BUCKET}/${profile.key}`;
        }
      } catch (err: any) {
        return response.unprocessable(req, res, `Failed to upload avatar: ${err}`);
      }
    } else {
      log.info("profile picture isn't defined !");
    }

    // hash password
    const user_password = (await hash_password(password)) || '';

    // Generate Otp
    const user_otp = generate_otp() || '';
    const now = new Date();
    const otp_expire_date = get_expire_date(now);

    // Process to user creation
    const create_user = await prisma.users.create({
      data: {
        email,
        password: user_password,
        first_name,
        last_name,
        phone,
        avatar_url: profile_url,
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });
    if (!create_user) return response.unprocessable(req, res, 'failed to create user !');

    // Mail to send OTP email to the user (non-blocking)
    const user_full_name = last_name + ' ' + first_name;
    let emailSent = false;

    try {
      await send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
        date: now,
        name: user_full_name,
        otp: user_otp,
      });
      emailSent = true;
      log.info('OTP email sent successfully', { email });
    } catch (mailError: any) {
      // Log error but don't fail the signup process
      log.warn('Failed to send OTP email, but user was created successfully', {
        email,
        error: mailError.message,
      });
    }

    const user_data = {
      email,
      first_name,
      last_name,
      phone,
      profile_url,
      otp: {
        user_otp,
        otp_expire_date,
      },
      email_sent: emailSent,
    };

    response.created(req, res, user_data, 'user_successfully creadted');
  },

  //*& Verify Account (OTP)
  verify_account: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, otp } = req.body;

    // Check all information are provided
    const missingFields = [];

    if (!email) missingFields.push('email');
    if (!otp) missingFields.push('otp');

    if (missingFields.length > 0)
      return response.badRequest(req, res, `missing field(s) : ${missingFields.join(', ')}`);

    // Check if user exist
    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });
    if (!user) return response.notFound(req, res, 'user not found !');

    // Check if user is already verified
    if (user.is_verified) return response.conflict(req, res, 'user already verified !');

    // Check if otp is valid
    if (user.otp?.code !== otp) return response.forbidden(req, res, 'invalid otp !');

    // Check if otp is expired
    const now = new Date();
    if (user.otp?.expire_at < now) return response.forbidden(req, res, 'otp expired !');

    // Update user to verified
    const verify_user = await prisma.users.update({
      where: { id: user.id },
      data: { is_verified: true, otp: null },
    });
    if (!verify_user) return response.unprocessable(req, res, 'failed to verify user !');

    return response.success(req, res, null, 'user successfully verified !');
  },

  //*& Resend OTP-Code
  resend_otp: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) return response.badRequest(req, res, 'email is required !');

    // Check if user exist
    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });
    if (!user) return response.notFound(req, res, 'user not found !');

    // Check if user is already verified
    if (user.is_verified) return response.conflict(req, res, 'user already verified !');

    // Generate otp
    const user_otp = generate_otp() || '';
    const now = new Date();
    const otp_expire_date = get_expire_date(now);

    // Save otp to user
    const update_user_otp = await prisma.users.update({
      where: { id: user.id },
      data: {
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });
    if (!update_user_otp) return response.unprocessable(req, res, 'failed to save otp !');

    // Mail to send OTP email to the user (non-blocking)
    const user_full_name = user.last_name + ' ' + user.first_name;

    try {
      await send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
        date: now,
        name: user_full_name,
        otp: user_otp,
      });
    } catch (mailError: any) {
      // Log error but don't fail the signup process
      log.warn('Failed to send OTP email, but user was created successfully', {
        email,
        error: mailError.message,
      });
    }

    return response.success(req, res, null, 'otp successfully resent !');
  },

  //*& Connexion (Login)
  login: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, password } = req.body;

    // Check all information are provided
    const missingFields = [];

    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0)
      return response.badRequest(req, res, `missing field(s) : ${missingFields.join(', ')}`);

    // Check if user exist
    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });
    if (!user) return response.notFound(req, res, 'user not found !');

    // Check if user is verified
    if (!user.is_verified) return response.forbidden(req, res, 'user not verified !');

    // Check if user is active
    if (!user.is_active) return response.forbidden(req, res, 'user not active !');

    // Check password
    const isPassword = await compare_password(password, user.password);
    if (!isPassword) return response.forbidden(req, res, 'invalid credentials !');

    // Save access token and refresh token
    user.password = '';
    user.otp = null;

    // Generate token
    const accessToken = userToken.accessToken(user);
    const refreshToken = userToken.refreshToken(user);
    log.info('generate access an refresh token...');

    // send token
    res.setHeader('authorization', `Bearer ${accessToken}`);
    log.info('save access token in header authorisation...');

    setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
      maxAge: envs.JWT_EXPIRES_IN,
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    });
    log.info('save access token in cookie...');

    // Everything is fine | return success message
    const user_data = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      profile_url: user.avatar_url,
    };

    return response.success(req, res, user_data, 'login successful !');
  },

  //*& Deconnexion Logout
  logout: async (req: Request, res: Response): Promise<void | Response<any>> => {
    // Check if user exist and fetch his data
    const user = await fetch(req, res);

    // BlackList the access and the refresh token of user
    await blackListAccessAndRefresToken(req, res);
    log.debug(`Access token and refresh token are blacklisted for: ${user?.user_id}`);

    // Clear the JWT cookie
    res.setHeader('authorization', ``);
    res.removeHeader('authorization');
    res.clearCookie(envs.JWT_SECRET, {
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    });

    return response.success(req, res, null, 'logout successful !');
  },

  //*& Forgot Password
  forgot_password: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) return response.badRequest(req, res, 'email is required !');

    // Check if user exist
    const user = await prisma.users.findFirst({
      where: { email, is_deleted: false },
    });
    if (!user) return response.notFound(req, res, 'user not found !');

    // Generate otp
    const user_otp = generate_otp() || '';
    const now = new Date();
    const otp_expire_date = get_expire_date(now);

    // Save otp to user
    const update_user_otp = await prisma.users.update({
      where: { id: user.id },
      data: {
        otp: {
          code: user_otp,
          expire_at: otp_expire_date,
        },
      },
    });
    if (!update_user_otp) return response.unprocessable(req, res, 'failed to save otp !');

    const token = userToken.generatePasswordResetToken(user.id);
    const resetLink = `https://gta-it.com/reset-password?token=${token}`;

    // Mail to send OTP email to the user (non-blocking)
    const user_full_name = user.last_name + ' ' + user.first_name;

    try {
      await send_mail(email, MAIL.RESET_PWD_SUBJECT, 'resetPassword', {
        name: user_full_name,
        resetLink: resetLink,
      });
      log.info('OTP email sent successfully', { email });
    } catch (mailError: any) {
      // Log error but don't fail the signup process
      log.warn('Failed to send OTP email, but user was created successfully', {
        email,
        error: mailError.message,
      });
    }
  },

  //& Reset Password
  reset_password: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { token, new_password } = req.body;
    //
  },

  //& changePassword
  change_password: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { current_password, new_password } = req.body;
  },

  //* ADMIN MANAGEMENT **********************************************************************************************************************************************************

  // List all Users: filter by : is_active, is_verified, is_deleted
  list_users: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { is_active, is_verified, is_deleted, ... } = req.query;
    //
  },

  //& Admin Delete User
  delete_user: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;
    //
  },

  //& Update User Info: first_name, last_name, phone, profile_url, ...
  update_user_info: async (req: Request, res: Response): Promise<void | Response<any>> => {

  },

  //& Search User: search by: email, téléphone, nom
  search_user: async (req: Request, res: Response): Promise<void | Response<any>> => {

  },

  //& Export Users: export as CSV/Excel
  export_users: async (req: Request, res: Response): Promise<void | Response<any>> => {

  },

  //& clearAll Users: for testing purpose only
  clear_all_users: async (req: Request, res: Response): Promise<void | Response<any>> => {

  },

  //& Update User Role
  update_user_role: async (req: Request, res: Response): Promise<void | Response<any>> => {

  },

  //& Others


  // **************************************************************************************************************************************
  // skip for now - User Preferences
  //* USER MANAGEMENT **********************************************************************************************************************************************************
  // 2FA
  // Login History
  // Active Sessions
  // Audit Logs
};

export default users_controller;
