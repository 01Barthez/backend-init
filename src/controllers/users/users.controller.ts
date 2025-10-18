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
import { asyncHandler, response, validateRequiredFields } from '@/utils/responses/helpers';
import setSafeCookie from '@/utils/setSafeCookie';

import {
  getCachedUserByEmail,
  getCachedUsersList,
  getCachedUsersSearch,
  invalidateAllUserCaches,
  invalidateUserCache,
} from './caching/user-cache';

const users_controller = {
  //* AUTH SETUP **********************************************************************************************************************************************************

  //*& Inscription (Sign up)
  signup: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, password, first_name, last_name, phone } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      'email',
      'password',
      'first_name',
      'last_name',
      'phone',
    ]);

    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    try {
      // Check if email already exists (use cache for performance)
      const existingUser = await getCachedUserByEmail(email);
      if (existingUser) {
        return response.conflict(req, res, 'Email already exists');
      }

      // Upload avatar if provided
      let profile_url = '';
      if (req.file) {
        try {
          const profile = await uploader.uploadBuffer(req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
          });

          if (profile?.key) {
            profile_url = `http${envs.MINIO_USE_SSL ? 's' : ''}://localhost${[80, 443].includes(Number(envs.MINIO_PORT)) ? '' : `:${envs.MINIO_PORT}`}/${envs.MINIO_APP_BUCKET}/${profile.key}`;
          }
        } catch (uploadError: any) {
          log.error('Avatar upload failed', { error: uploadError.message });
          return response.unprocessable(
            req,
            res,
            `Failed to upload avatar: ${uploadError.message}`,
          );
        }
      }

      // Hash password
      const hashedPassword = await hash_password(password);

      // Generate OTP
      const user_otp = generate_otp();
      const now = new Date();
      const otp_expire_date = get_expire_date(now);

      // Create user
      const newUser = await prisma.users.create({
        data: {
          email,
          password: hashedPassword || '',
          first_name,
          last_name,
          phone,
          avatar_url: profile_url,
          otp: {
            code: user_otp || '000000',
            expire_at: otp_expire_date,
          },
        },
      });

      // Send OTP email (non-blocking)
      const user_full_name = `${last_name} ${first_name}`;
      let emailSent = false;

      send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
        date: now,
        name: user_full_name,
        otp: user_otp,
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

      log.info('User created successfully', { userId: newUser.id, email });

      return response.created(
        req,
        res,
        {
          email,
          first_name,
          last_name,
          phone,
          profile_url,
          otp: {
            otp_expire_date,
          },
          email_sent: emailSent,
        },
        'User created successfully',
      );
    } catch (error: any) {
      log.error('Signup failed', { error: error.message, email });
      return response.serverError(req, res, 'Failed to create user account', error);
    }
  }),

  //*& Verify Account (OTP)
  verify_account: asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { email, otp } = req.body;

      const validation = validateRequiredFields(req.body, ['email', 'otp']);
      if (!validation.valid) {
        return response.badRequest(
          req,
          res,
          `Missing required field(s): ${validation.missing.join(', ')}`,
        );
      }

      try {
        // Get user from database (bypass cache for OTP verification)
        const user = await getCachedUserByEmail(email);

        if (!user) {
          return response.notFound(req, res, 'User not found');
        }

        if (user.is_verified) {
          return response.conflict(req, res, 'User already verified');
        }

        // Check OTP validity
        if (user.otp?.code !== otp) {
          return response.forbidden(req, res, 'Invalid OTP code');
        }

        // Check OTP expiration
        const now = new Date();
        if (user.otp?.expire_at && user.otp.expire_at < now) {
          return response.forbidden(req, res, 'OTP has expired');
        }

        // Verify user
        await prisma.users.update({
          where: { id: user.id },
          data: { is_verified: true, otp: null, email_verified_at: now },
        });

        // Invalidate cache
        await invalidateUserCache(user.id, email);

        // Send welcome email (non-blocking)
        const user_full_name = `${user.last_name} ${user.first_name}`;

        send_mail(email, MAIL.WELCOME_SUBJECT, 'welcome', {
          name: user_full_name,
        }).catch((error) => {
          log.warn('Failed to send welcome email', { email, error: error.message });
        });

        log.info('User verified successfully', { userId: user.id, email });

        return response.ok(req, res, { email }, 'Account verified successfully');
      } catch (error: any) {
        log.error('Account verification failed', { error: error.message, email });
        return response.serverError(req, res, 'Failed to verify account', error);
      }
    },
  ),

  //*& Resend OTP
  resend_otp: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email } = req.body;

    if (!email) {
      return response.badRequest(req, res, 'Email is required');
    }

    try {
      const user = await getCachedUserByEmail(email);

      if (!user) {
        return response.notFound(req, res, 'User not found');
      }

      if (user.is_verified) {
        return response.conflict(req, res, 'User already verified');
      }

      // Generate new OTP
      const user_otp = generate_otp() || '000000';
      const now = new Date();
      const otp_expire_date = get_expire_date(now);

      // Update user with new OTP
      await prisma.users.update({
        where: { id: user.id },
        data: {
          otp: {
            code: user_otp,
            expire_at: otp_expire_date,
          },
        },
      });

      // Invalidate cache
      await invalidateUserCache(user.id, email);

      // Send OTP email
      const user_full_name = `${user.last_name} ${user.first_name}`;
      let emailSent = false;

      try {
        await send_mail(email, MAIL.OTP_SUBJECT, 'otp', {
          date: now,
          name: user_full_name,
          otp: user_otp,
        });
        emailSent = true;
        log.info('OTP resent successfully', { email });
      } catch (mailError: any) {
        log.error('Failed to resend OTP email', { email, error: mailError.message });
        return response.unprocessable(req, res, 'Failed to send OTP email');
      }

      return response.ok(req, res, { email_sent: emailSent }, 'OTP resent successfully');
    } catch (error: any) {
      log.error('Resend OTP failed', { error: error.message, email });
      return response.serverError(req, res, 'Failed to resend OTP', error);
    }
  }),

  //*& Login
  login: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { email, password } = req.body;

    const validation = validateRequiredFields(req.body, ['email', 'password']);
    if (!validation.valid) {
      return response.badRequest(
        req,
        res,
        `Missing required field(s): ${validation.missing.join(', ')}`,
      );
    }

    try {
      // Get user from database (need password for verification)
      const user = await getCachedUserByEmail(email);

      if (!user) {
        return response.unauthorized(req, res, 'Invalid email or password');
      }

      if (!user.is_verified) {
        return response.forbidden(req, res, 'Please verify your account first');
      }

      if (!user.is_active) {
        return response.forbidden(req, res, 'Your account has been deactivated');
      }

      // Verify password
      const isPasswordValid = await compare_password(password, user.password);
      if (!isPasswordValid) {
        return response.unauthorized(req, res, 'Invalid email or password');
      }

      user.password = '';
      user.otp = null;

      // Generate tokens
      const accessToken = userToken.accessToken(user);
      const refreshToken = userToken.refreshToken(user);

      // Set cookies
      res.setHeader('authorization', `Bearer ${accessToken}`);
      setSafeCookie(res, envs.JWT_SECRET, refreshToken, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('User logged in successfully', { userId: user.id, email });

      // Send login alert email (non-blocking)
      const user_full_name = `${user.last_name} ${user.first_name}`;
      send_mail(email, MAIL.LOGIN_ALERT_SUBJECT, 'alert_login', {
        name: user_full_name,
        date: new Date(),
      }).catch((error) => {
        log.warn('Failed to send login alert email', { email, error: error.message });
      });

      return response.ok(
        req,
        res,
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          profile_url: user.avatar_url,
        },
        'Login successful',
      );
    } catch (error: any) {
      log.error('Login failed', { error: error.message, email });
      return response.serverError(req, res, 'Login failed', error);
    }
  }),

  //*& Logout
  logout: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      const user = (req as any).user;

      if (!user) {
        return response.unauthorized(req, res, 'User not authenticated');
      }

      // Blacklist tokens
      await blackListAccessAndRefresToken(req, res);

      // Clear cookies
      res.removeHeader('authorization');
      res.clearCookie(envs.JWT_SECRET, {
        secure: envs.COOKIE_SECURE as boolean,
        httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
        sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
      });

      log.info('User logged out successfully', { userId: user.id });

      return response.ok(req, res, null, 'Logout successful');
    } catch (error: any) {
      log.error('Logout failed', { error: error.message });
      return response.serverError(req, res, 'Logout failed', error);
    }
  }),

  //*& Forgot Password
  forgot_password: asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { email } = req.body;

      if (!email) {
        return response.badRequest(req, res, 'Email is required');
      }

      try {
        const user = await prisma.users.findFirst({
          where: { email, is_deleted: false },
        });

        if (!user) {
          // Security: Don't reveal whether email exists
          return response.ok(
            req,
            res,
            { email_sent: true },
            'If email exists, password reset link has been sent',
          );
        }

        // Generate password reset token
        const resetToken = userToken.generatePasswordResetToken(user.id);
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
      } catch (error: any) {
        log.error('Forgot password failed', { error: error.message, email });
        return response.serverError(req, res, 'Failed to process password reset request', error);
      }
    },
  ),

  //*& Reset Password
  reset_password: asyncHandler(
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
          where: { id: userId, is_deleted: false },
        });

        if (!user) {
          return response.notFound(req, res, 'User not found');
        }

        // Hash new password
        const hashedPassword = await hash_password(new_password);

        // Update password
        await prisma.users.update({
          where: { id: userId },
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
  ),

  //*& Change Password
  change_password: asyncHandler(
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

      try {
        // Get user with password
        const dbUser = await prisma.users.findFirst({
          where: { id: user.id, is_deleted: false },
        });

        if (!dbUser) {
          return response.notFound(req, res, 'User not found');
        }

        // Verify current password
        const isPasswordValid = await compare_password(current_password, dbUser.password);
        if (!isPasswordValid) {
          return response.forbidden(req, res, 'Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await hash_password(new_password);

        // Update password
        await prisma.users.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        // Invalidate cache
        await invalidateUserCache(user.id, dbUser.email);

        log.info('Password changed successfully', { userId: user.id });

        return response.ok(req, res, null, 'Password changed successfully');
      } catch (error: any) {
        log.error('Change password failed', { error: error.message, userId: user.id });
        return response.serverError(req, res, 'Failed to change password', error);
      }
    },
  ),

  //* USER MANAGEMENT **********************************************************************************************************************************************************

  //*& Update User Info
  update_user_info: asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const user = (req as any).user;
      const { first_name, last_name, phone } = req.body;

      if (!user) {
        return response.unauthorized(req, res, 'User not authenticated');
      }

      try {
        // Build update data
        const updateData: any = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (phone) updateData.phone = phone;

        // Handle avatar upload
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
          } catch (uploadError: any) {
            log.error('Avatar upload failed', { error: uploadError.message });
            return response.unprocessable(req, res, 'Failed to upload avatar');
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

        // Invalidate cache
        await invalidateUserCache(user.id, updatedUser.email);

        log.info('User info updated', { userId: user.id });

        return response.ok(req, res, updatedUser, 'User info updated successfully');
      } catch (error: any) {
        log.error('Update user info failed', { error: error.message, userId: user.id });
        return response.serverError(req, res, 'Failed to update user info', error);
      }
    },
  ),

  //* ADMIN MANAGEMENT **********************************************************************************************************************************************************

  //*& List Users
  list_users: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { is_active, is_verified, is_deleted, page = '1', limit = '10' } = req.query;

    try {
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      // Build filters
      const filters: any = { page: pageNum, limit: limitNum };
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (is_verified !== undefined) filters.is_verified = is_verified === 'true';
      if (is_deleted !== undefined) filters.is_deleted = is_deleted === 'true';

      // Get cached users list
      const { users, total } = await getCachedUsersList(filters);

      const totalPages = Math.ceil(total / limitNum);

      log.info('Users list retrieved', { page: pageNum, limit: limitNum, total });

      return response.paginated(
        req,
        res,
        users,
        total,
        totalPages,
        pageNum,
        'Users retrieved successfully',
      );
    } catch (error: any) {
      log.error('List users failed', { error: error.message });
      return response.serverError(req, res, 'Failed to retrieve users', error);
    }
  }),

  //*& Search Users
  search_user: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { search } = req.query;

    if (!search) {
      return response.badRequest(req, res, 'Search query is required');
    }

    try {
      // Get cached search results
      const users = await getCachedUsersSearch(search as string);

      log.info('User search completed', { query: search, results: users.length });

      return response.ok(req, res, users, `Found ${users.length} users`);
    } catch (error: any) {
      log.error('Search users failed', { error: error.message, query: search });
      return response.serverError(req, res, 'Failed to search users', error);
    }
  }),

  //*& Export Users
  export_users: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    try {
      // Get all users (no cache for exports to ensure fresh data)
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
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // Generate CSV
      const csvHeader = 'ID,Email,First Name,Last Name,Phone,Active,Verified,Created At\n';
      const csvRows = users
        .map(
          (user) =>
            `${user.id},${user.email},${user.first_name},${user.last_name},${user.phone},${user.is_active},${user.is_verified},${user.created_at}`,
        )
        .join('\n');
      const csv = csvHeader + csvRows;

      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');

      log.info('Users exported', { count: users.length });

      return res.send(csv);
    } catch (error: any) {
      log.error('Export users failed', { error: error.message });
      return response.serverError(req, res, 'Failed to export users', error);
    }
  }),

  //*& Delete User
  delete_user: asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { user_id } = req.params;

    if (!user_id) {
      return response.badRequest(req, res, 'User ID is required');
    }

    try {
      // Get user
      const user = await prisma.users.findFirst({
        where: { id: user_id },
      });

      if (!user) {
        return response.notFound(req, res, 'User not found');
      }

      // Soft delete
      await prisma.users.update({
        where: { id: user_id },
        data: {
          is_deleted: true,
          is_active: false,
        },
      });

      // Invalidate cache
      await invalidateUserCache(user_id, user.email);

      log.info('User soft deleted', { userId: user_id });

      return response.ok(req, res, null, 'User deleted successfully');
    } catch (error: any) {
      log.error('Delete user failed', { error: error.message, userId: user_id });
      return response.serverError(req, res, 'Failed to delete user', error);
    }
  }),

  //*& Update User Role
  update_user_role: asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      const { user_id } = req.params;
      const { role } = req.body;

      const validation = validateRequiredFields({ user_id, role }, ['user_id', 'role']);
      if (!validation.valid) {
        return response.badRequest(
          req,
          res,
          `Missing required field(s): ${validation.missing.join(', ')}`,
        );
      }

      try {
        // Get user
        const user = await prisma.users.findFirst({
          where: { id: user_id, is_deleted: false },
        });

        if (!user) {
          return response.notFound(req, res, 'User not found');
        }

        // Update role (commented out until role field is added to Prisma schema)
        await prisma.users.update({
          where: { id: user_id },
          data: { role },
        });

        // Invalidate cache
        await invalidateUserCache(user_id, user.email);

        log.info('User role updated', { userId: user_id, newRole: role });

        return response.ok(req, res, null, 'User role updated successfully');
      } catch (error: any) {
        log.error('Update user role failed', { error: error.message, userId: user_id });
        return response.serverError(req, res, 'Failed to update user role', error);
      }
    },
  ),

  //*& Clear All Users (Development Only)
  clear_all_users: asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      if (envs.NODE_ENV !== 'development') {
        return response.forbidden(
          req,
          res,
          'This action is only allowed in development environment',
        );
      }

      try {
        // Delete all users
        await prisma.users.deleteMany({});

        // Clear all user caches
        await invalidateAllUserCaches();

        log.warn('All users cleared from database');

        return response.ok(req, res, null, 'All users cleared successfully');
      } catch (error: any) {
        log.error('Clear all users failed', { error: error.message });
        return response.serverError(req, res, 'Failed to clear all users', error);
      }
    },
  ),

  // ***************************************************************************************************************************************************************************************************************************************
  // skip for now - User Preferences
  //* USER MANAGEMENT **********************************************************************************************************************************************************
  // 2FA
  // Login History
  // Active Sessions
  // Audit Logs
};

export default users_controller;
