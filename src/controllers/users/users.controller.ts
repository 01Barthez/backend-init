import type { Request, Response } from 'express';

import { envs } from '@/config/env/env';
import { uploader } from '@/config/minio/minio';
import prisma from '@/config/prisma/prisma';
import { MAIL } from '@/core/constant/global';
import send_mail from '@/services/Mail/send-mail';
import blackListAccessAndRefresToken from '@/services/jwt/black_list_access_&_refresh_tokens';
import userToken from '@/services/jwt/functions-jwt';
import log from '@/services/logging/logger';
import { get_expire_date } from '@/utils/Otp/OTPExpirationDate';
import generate_otp from '@/utils/Otp/generateOtp';
import { compare_password, hash_password } from '@/utils/password/hashPassword';
import { response } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

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
    if (user.otp?.expire_at && user.otp.expire_at < now)
      return response.forbidden(req, res, 'otp expired !');

    // Update user to verified
    const verify_user = await prisma.users.update({
      where: { id: user.id },
      data: { is_verified: true, otp: null },
    });
    if (!verify_user) return response.unprocessable(req, res, 'failed to verify user !');

    // Welcome mail to users (non-blocking)
    try {
      await send_mail(email, MAIL.WELCOME_SUBJECT, 'welcome', {
        name: user.last_name + ' ' + user.first_name,
      });
      log.info('Welcome sent successfully', { email });
    } catch (mailError: any) {
      // Log error but don't fail the signup process
      log.warn('Failed to send welcome email, but user was created successfully', {
        email,
        error: mailError.message,
      });
    }

    return response.ok(req, res, null, 'user successfully verified !');
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

    return response.ok(req, res, null, 'otp successfully resent !');
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

    return response.ok(req, res, user_data, 'login successful !');
  },

  //*& Deconnexion Logout
  logout: async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const user = (req as any).user;

      if (!user) {
        return response.unauthorized(req, res, 'User not authenticated');
      }

      // BlackList the access and the refresh token of user
      await blackListAccessAndRefresToken(req, res);
      log.debug(`Access token and refresh token are blacklisted for: ${user.id}`);

      // Clear the JWT cookie
      res.setHeader('authorization', '');
      res.removeHeader('authorization');
      res.clearCookie(envs.JWT_SECRET, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      return response.ok(req, res, null, 'logout successful !');
    } catch (error: any) {
      log.error('Logout error', { error: error.message });
      return response.unprocessable(req, res, 'Failed to logout');
    }
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

    // Generate password reset token
    const token = userToken.generatePasswordResetToken(user.id);
    const resetLink = `${envs.CLIENT_URL}/reset-password?token=${token}`;

    // Mail to send password reset email to the user (non-blocking)
    const user_full_name = user.last_name + ' ' + user.first_name;
    let emailSent = false;

    try {
      await send_mail(email, MAIL.RESET_PWD_SUBJECT, 'resetPassword', {
        name: user_full_name,
        resetLink: resetLink,
      });
      emailSent = true;
      log.info('Password reset email sent successfully', { email });
    } catch (mailError: any) {
      log.warn('Failed to send password reset email', {
        email,
        error: mailError.message,
      });
    }

    return response.ok(
      req,
      res,
      { email_sent: emailSent },
      'Password reset link sent to your email',
    );
  },

  //& Reset Password
  reset_password: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { resetToken } = req.params;
    const { new_password } = req.body;

    if (!resetToken) return response.badRequest(req, res, 'Reset token is required');
    if (!new_password) return response.badRequest(req, res, 'New password is required');

    try {
      // Verify reset token
      const decoded = userToken.verifyPasswordResetToken(resetToken);
      const userId = decoded.userId;

      // Check if user exists
      const user = await prisma.users.findFirst({
        where: { id: userId, is_deleted: false },
      });

      if (!user) return response.notFound(req, res, 'User not found');

      // Hash new password
      const hashedPassword = await hash_password(new_password);

      // Update password
      await prisma.users.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      log.info('Password reset successfully', { userId });

      return response.ok(req, res, null, 'Password reset successfully');
    } catch (error: any) {
      log.error('Password reset failed', { error: error.message });
      return response.unprocessable(req, res, 'Invalid or expired reset token');
    }
  },

  //& changePassword
  change_password: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { current_password, new_password } = req.body;
    const user = (req as any).user;

    if (!user) return response.unauthorized(req, res, 'User not authenticated');

    // Check all information are provided
    if (!current_password) return response.badRequest(req, res, 'Current password is required');
    if (!new_password) return response.badRequest(req, res, 'New password is required');

    // Get user from database
    const dbUser = await prisma.users.findFirst({
      where: { id: user.id, is_deleted: false },
    });

    if (!dbUser) return response.notFound(req, res, 'User not found');

    // Verify current password
    const isPasswordValid = await compare_password(current_password, dbUser.password);
    if (!isPasswordValid) return response.forbidden(req, res, 'Current password is incorrect');

    // Hash new password
    const hashedPassword = await hash_password(new_password);

    // Update password
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    log.info('Password changed successfully', { userId: user.id });

    return response.ok(req, res, null, 'Password changed successfully');
  },

  //* ADMIN MANAGEMENT **********************************************************************************************************************************************************

  // List all Users: filter by : is_active, is_verified, is_deleted
  list_users: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { is_active, is_verified, is_deleted, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = { is_deleted: false };
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (is_verified !== undefined) filter.is_verified = is_verified === 'true';
    if (is_deleted !== undefined) filter.is_deleted = is_deleted === 'true';

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: filter,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          is_deleted: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.users.count({ where: filter }),
    ]);

    return response.ok(
      req,
      res,
      {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Users retrieved successfully',
    );
  },

  //& Admin Delete User (soft delete)
  delete_user: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;

    if (!user_id) return response.badRequest(req, res, 'User ID is required');

    // Check if user exists
    const user = await prisma.users.findFirst({
      where: { id: user_id },
    });

    if (!user) return response.notFound(req, res, 'User not found');

    // Soft delete user
    await prisma.users.update({
      where: { id: user_id },
      data: {
        is_deleted: true,
        is_active: false,
      },
    });

    log.info('User soft deleted', { userId: user_id });

    return response.ok(req, res, null, 'User deleted successfully');
  },

  //& Update User Info: first_name, last_name, phone, profile_url, ...
  update_user_info: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const user = (req as any).user;
    const { first_name, last_name, phone } = req.body;

    if (!user) return response.unauthorized(req, res, 'User not authenticated');

    // Build update data
    const updateData: any = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;

    // Handle avatar upload if present
    if (req.file) {
      try {
        const profile = await uploader.uploadBuffer(req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
        });

        if (profile?.key) {
          updateData.avatar_url = `http${envs.MINIO_USE_SSL ? 's' : ''}://localhost${[80, 443].includes(Number(envs.MINIO_PORT)) ? '' : `:${envs.MINIO_PORT}`}/${envs.MINIO_APP_BUCKET}/${profile.key}`;
        }
      } catch (err: any) {
        return response.unprocessable(req, res, `Failed to upload avatar: ${err}`);
      }
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
      },
    });

    log.info('User info updated', { userId: user.id });

    return response.ok(req, res, updatedUser, 'User info updated successfully');
  },

  //& Search User: search by: email, téléphone, nom
  search_user: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { search } = req.query;

    if (!search) return response.badRequest(req, res, 'Search query is required');

    const searchTerm = search as string;

    // Search users
    const users = await prisma.users.findMany({
      where: {
        is_deleted: false,
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { first_name: { contains: searchTerm, mode: 'insensitive' } },
          { last_name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        is_verified: true,
        role: true,
      },
      take: 20,
    });

    return response.ok(req, res, users, `Found ${users.length} users`);
  },

  //& Export Users: export as CSV/Excel
  export_users: async (req: Request, res: Response): Promise<void | Response<any>> => {
    // Get all users
    const users = await prisma.users.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        is_active: true,
        is_verified: true,
        role: true,
        created_at: true,
      },
    });

    // Convert to CSV format
    const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Role,Created At\n';
    const csvRows = users
      .map(
        (user) =>
          `${user.id},${user.email},${user.first_name},${user.last_name},${user.phone},${user.is_active},${user.is_verified},${user.role},${user.created_at}`,
      )
      .join('\n');
    const csv = csvHeader + csvRows;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');

    return res.send(csv);
  },

  //& clearAll Users: for testing purpose only
  clear_all_users: async (req: Request, res: Response): Promise<void | Response<any>> => {
    // Only allow in development environment
    if (envs.NODE_ENV !== 'development') {
      return response.forbidden(req, res, 'This action is only allowed in development environment');
    }

    // Delete all users
    await prisma.users.deleteMany({});

    log.warn('All users cleared from database');

    return response.ok(req, res, null, 'All users cleared successfully');
  },

  //& Update User Role
  update_user_role: async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;
    const { role } = req.body;

    if (!user_id) return response.badRequest(req, res, 'User ID is required');
    if (!role) return response.badRequest(req, res, 'Role is required');

    // Check if user exists
    const user = await prisma.users.findFirst({
      where: { id: user_id, is_deleted: false },
    });

    if (!user) return response.notFound(req, res, 'User not found');

    // Update user role
    await prisma.users.update({
      where: { id: user_id },
      data: { role },
    });

    log.info('User role updated', { userId: user_id, newRole: role });

    return response.ok(req, res, null, 'User role updated successfully');
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
