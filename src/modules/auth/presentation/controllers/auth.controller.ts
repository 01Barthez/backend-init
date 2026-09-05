import type { Request, Response } from 'express';

import { envs } from '@/app/config';
import { AUTH_COOKIES } from '@/shared/constants/app.constants';
import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';
import setSafeCookie from '@/shared/utils/http/set-safe-cookie';

import type { ChangePasswordCommand } from '../../application/commands/change-password.command';
import type { ConfirmTotpCommand } from '../../application/commands/confirm-totp.command';
import type { ConsumeRecoveryCodeCommand } from '../../application/commands/consume-recovery-code.command';
import type { DisableTotpCommand } from '../../application/commands/disable-totp.command';
import type { EnrollTotpCommand } from '../../application/commands/enroll-totp.command';
import type { ForgotPasswordCommand } from '../../application/commands/forgot-password.command';
import type { GenerateRecoveryCodesCommand } from '../../application/commands/generate-recovery-codes.command';
import type { LoginCommand } from '../../application/commands/login.command';
import type { LogoutCommand } from '../../application/commands/logout.command';
import type { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import type { ResendOtpCommand } from '../../application/commands/resend-otp.command';
import type { ResetPasswordCommand } from '../../application/commands/reset-password.command';
import type { RevokeSessionCommand } from '../../application/commands/revoke-session.command';
import type { SignupCommand } from '../../application/commands/signup.command';
import type { VerifyOtpCommand } from '../../application/commands/verify-otp.command';
import type { GetCurrentUserQuery } from '../../application/queries/get-current-user.query';
import type { ListSessionsQuery } from '../../application/queries/list-sessions.query';
import type { TokenServicePort } from '../../application/services/token.service.port';
import { AuthSerializer } from '../serializers/auth.serializer';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export type AuthControllerDeps = {
  login: LoginCommand;
  signup: SignupCommand;
  logout: LogoutCommand;
  refreshToken: RefreshTokenCommand;
  verifyOtp: VerifyOtpCommand;
  resendOtp: ResendOtpCommand;
  forgotPassword: ForgotPasswordCommand;
  resetPassword: ResetPasswordCommand;
  changePassword: ChangePasswordCommand;
  getCurrentUser: GetCurrentUserQuery;
  listSessions: ListSessionsQuery;
  revokeSession: RevokeSessionCommand;
  enrollTotp: EnrollTotpCommand;
  confirmTotp: ConfirmTotpCommand;
  disableTotp: DisableTotpCommand;
  generateRecoveryCodes: GenerateRecoveryCodesCommand;
  consumeRecoveryCode: ConsumeRecoveryCodeCommand;
  tokenService: TokenServicePort;
};

const cookieOptions = {
  secure: envs.COOKIE_SECURE as boolean,
  httpOnly: envs.JWT_COOKIE_SECURITY as boolean,
  sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
};

/**
 * Thin Express handlers — extract HTTP concerns, call use cases, serialize.
 * Business rules live in application commands, not here.
 */
export function createAuthController(deps: AuthControllerDeps) {
  const login = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.login.execute({
      email: req.body.email,
      password: req.body.password,
      totpCode: req.body.totpCode,
    });

    res.setHeader('authorization', `Bearer ${result.accessToken}`);
    setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, result.refreshToken, cookieOptions);

    return response.ok(req, res, AuthSerializer.login(result), 'Login successful');
  });

  const signup = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const result = await deps.signup.execute({
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatarFile: file
        ? {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          }
        : undefined,
    });

    return response.created(req, res, AuthSerializer.signup(result), 'User created successfully');
  });

  const logout = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const refreshCookieName = deps.tokenService.getRefreshCookieName();
    const refreshToken = req.cookies?.[refreshCookieName];

    const result = await deps.logout.execute({
      userId: user?.id ?? '',
      refreshToken,
      accessJti: user?.jti,
      accessExpiresAt: user?.exp ? new Date(user.exp * 1000) : undefined,
    });

    res.removeHeader('authorization');
    res.clearCookie(result.refreshCookieName, {
      path: '/',
      secure: envs.COOKIE_SECURE as boolean,
      httpOnly: envs.COOKIE_HTTP_STATUS as boolean,
      sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    });

    return response.ok(req, res, null, 'Logout successful');
  });

  const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const cookieName = envs.REFRESH_TOKEN_COOKIE || deps.tokenService.getRefreshCookieName();
    const token = req.cookies?.[cookieName] ?? req.body?.refreshToken;

    const result = await deps.refreshToken.execute({ refreshToken: token });

    res.setHeader('authorization', `Bearer ${result.accessToken}`);
    setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, result.refreshToken, cookieOptions);

    return response.ok(req, res, AuthSerializer.refresh(result.accessToken), 'Token refreshed');
  });

  const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.verifyOtp.execute({
      email: req.body.email,
      otp: req.body.otp,
    });
    return response.ok(
      req,
      res,
      AuthSerializer.verifyOtp(result.email),
      'Account verified successfully',
    );
  });

  const resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.resendOtp.execute({ email: req.body.email });
    return response.ok(
      req,
      res,
      AuthSerializer.resendOtp(result.emailSent),
      'OTP resent successfully',
    );
  });

  const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.forgotPassword.execute({ email: req.body.email });
    return response.ok(req, res, AuthSerializer.forgotPassword(result.emailSent), result.message);
  });

  const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const resetToken = (req.body.resetToken as string) || (req.query.token as string);
    await deps.resetPassword.execute({
      resetToken,
      newPassword: req.body.new_password,
    });
    return response.ok(req, res, null, 'Password reset successfully');
  });

  const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await deps.changePassword.execute({
      userId: user?.id ?? '',
      currentPassword: req.body.current_password,
      newPassword: req.body.new_password,
    });
    return response.ok(req, res, null, 'Password changed successfully');
  });

  const me = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const profile = await deps.getCurrentUser.execute(user?.id ?? '');
    return response.ok(req, res, AuthSerializer.me(profile), 'Current user');
  });

  const listSessions = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const sessions = await deps.listSessions.execute(user?.id ?? '');
    return response.ok(req, res, AuthSerializer.sessions(sessions), 'Sessions');
  });

  const revokeSession = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await deps.revokeSession.execute({
      userId: user?.id ?? '',
      familyId: req.params.familyId,
    });
    return response.ok(req, res, null, 'Session revoked');
  });

  const enrollTotp = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await deps.enrollTotp.execute({ userId: user?.id ?? '' });
    return response.ok(req, res, AuthSerializer.totpEnroll(result), 'TOTP enrollment started');
  });

  const confirmTotp = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await deps.confirmTotp.execute({
      userId: user?.id ?? '',
      totpCode: req.body.totpCode,
    });
    return response.ok(req, res, null, 'TOTP enabled');
  });

  const disableTotp = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await deps.disableTotp.execute({
      userId: user?.id ?? '',
      totpCode: req.body.totpCode,
      currentPassword: req.body.current_password,
    });
    return response.ok(req, res, null, 'TOTP disabled');
  });

  const generateRecoveryCodes = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await deps.generateRecoveryCodes.execute({ userId: user?.id ?? '' });
    return response.ok(
      req,
      res,
      { codes: result.codes },
      'Recovery codes generated — store them safely, they will not be shown again',
    );
  });

  const consumeRecoveryCode = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.consumeRecoveryCode.execute({
      email: req.body.email,
      password: req.body.password,
      recoveryCode: req.body.recoveryCode,
    });

    res.setHeader('authorization', `Bearer ${result.accessToken}`);
    setSafeCookie(res, AUTH_COOKIES.REFRESH_TOKEN, result.refreshToken, cookieOptions);

    return response.ok(
      req,
      res,
      AuthSerializer.login(result),
      `Login successful — ${result.remainingCodes} recovery code(s) remaining`,
    );
  });

  return {
    login,
    signup,
    logout,
    refreshToken,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    me,
    listSessions,
    revokeSession,
    enrollTotp,
    confirmTotp,
    disableTotp,
    generateRecoveryCodes,
    consumeRecoveryCode,
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
