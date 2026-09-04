import type { Router } from 'express';

import { type AuditPort, auditRepository } from '@/shared/infrastructure/audit';

import { ChangePasswordCommand } from './application/commands/change-password.command';
import { ConfirmTotpCommand } from './application/commands/confirm-totp.command';
import { ConsumeRecoveryCodeCommand } from './application/commands/consume-recovery-code.command';
import { DisableTotpCommand } from './application/commands/disable-totp.command';
import { EnrollTotpCommand } from './application/commands/enroll-totp.command';
import { ForgotPasswordCommand } from './application/commands/forgot-password.command';
import { GenerateRecoveryCodesCommand } from './application/commands/generate-recovery-codes.command';
import { LoginCommand } from './application/commands/login.command';
import { LogoutCommand } from './application/commands/logout.command';
import { RefreshTokenCommand } from './application/commands/refresh-token.command';
import { ResendOtpCommand } from './application/commands/resend-otp.command';
import { ResetPasswordCommand } from './application/commands/reset-password.command';
import { RevokeSessionCommand } from './application/commands/revoke-session.command';
import { SignupCommand } from './application/commands/signup.command';
import { VerifyOtpCommand } from './application/commands/verify-otp.command';
import { GetCurrentUserQuery } from './application/queries/get-current-user.query';
import { ListSessionsQuery } from './application/queries/list-sessions.query';
import type { AvatarUploaderPort } from './application/services/avatar-uploader.port';
import type { MailerPort } from './application/services/mailer.port';
import type { RbacPort } from './application/services/rbac.port';
import type { TokenServicePort } from './application/services/token.service.port';
import type { UserCachePort } from './application/services/user-cache.port';
import type { TokenRepositoryPort } from './domain/repositories/token.repository';
import type { UserRepositoryPort } from './domain/repositories/user.repository';
import { JwtTokenProvider } from './infrastructure/providers/jwt-token.provider';
import {
  createAvatarUploaderAdapter,
  createMailerAdapter,
  createRbacAdapter,
  createUserCacheAdapter,
} from './infrastructure/providers/legacy-adapters';
import { PrismaTokenRepository } from './infrastructure/repositories/prisma-token.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import {
  type AuthController,
  createAuthController,
} from './presentation/controllers/auth.controller';
import { createAuthRoutes } from './presentation/routes/auth.routes';

/**
 * Explicit dependencies for the auth module.
 * Register these in `src/app/container` when the composition root lands.
 */
export type AuthModuleDeps = {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  tokenService: TokenServicePort;
  mailer: MailerPort;
  rbac: RbacPort;
  avatarUploader: AvatarUploaderPort;
  userCache?: UserCachePort;
  audit?: AuditPort;
};

export type AuthModule = {
  deps: AuthModuleDeps;
  useCases: {
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
  };
  controller: AuthController;
  router: Router;
};

/**
 * Builds default infrastructure adapters.
 * Override any key when wiring a test double or alternate provider.
 */
export function createDefaultAuthDeps(overrides: Partial<AuthModuleDeps> = {}): AuthModuleDeps {
  const userRepository = overrides.userRepository ?? new PrismaUserRepository();
  const tokenRepository = overrides.tokenRepository ?? new PrismaTokenRepository();
  const rbac = overrides.rbac ?? createRbacAdapter();
  const mailer = overrides.mailer ?? createMailerAdapter();
  const avatarUploader = overrides.avatarUploader ?? createAvatarUploaderAdapter();
  const userCache = overrides.userCache ?? createUserCacheAdapter();

  const tokenService =
    overrides.tokenService ?? new JwtTokenProvider({ userRepository, tokenRepository, rbac });

  return {
    userRepository,
    tokenRepository,
    tokenService,
    mailer,
    rbac,
    avatarUploader,
    userCache,
    audit: overrides.audit ?? auditRepository,
  };
}

/**
 * Composition root for the auth bounded context.
 */
export function createAuthModule(deps: AuthModuleDeps): AuthModule {
  const useCases = {
    login: new LoginCommand(deps),
    signup: new SignupCommand(deps),
    logout: new LogoutCommand(deps),
    refreshToken: new RefreshTokenCommand(deps),
    verifyOtp: new VerifyOtpCommand(deps),
    resendOtp: new ResendOtpCommand(deps),
    forgotPassword: new ForgotPasswordCommand(deps),
    resetPassword: new ResetPasswordCommand(deps),
    changePassword: new ChangePasswordCommand(deps),
    getCurrentUser: new GetCurrentUserQuery(deps),
    listSessions: new ListSessionsQuery(deps),
    revokeSession: new RevokeSessionCommand(deps),
    enrollTotp: new EnrollTotpCommand(deps),
    confirmTotp: new ConfirmTotpCommand(deps),
    disableTotp: new DisableTotpCommand(deps),
    generateRecoveryCodes: new GenerateRecoveryCodesCommand(deps),
    consumeRecoveryCode: new ConsumeRecoveryCodeCommand(deps),
  };

  const controller = createAuthController({
    ...useCases,
    tokenService: deps.tokenService,
  });


  const router = createAuthRoutes(controller);

  return { deps, useCases, controller, router };
}

/** Convenience: fully wired auth Express router for route registration. */
export function createAuthRouter(overrides: Partial<AuthModuleDeps> = {}): Router {
  return createAuthModule(createDefaultAuthDeps(overrides)).router;
}

export type { TokenServicePort } from './application/services/token.service.port';
export type { UserEntity } from './domain/entities/user.entity';
export type {
  AuthRevokeReason,
  AuthSessionSummary,
  AuthTokenFamily,
  TokenPair,
  UserJwtPayload,
} from './domain/types/auth.types';
export {
  BlacklistProvider,
  blacklistProvider,
} from './infrastructure/providers/blacklist.provider';
export { JwtTokenProvider } from './infrastructure/providers/jwt-token.provider';
export { PrismaTokenRepository } from './infrastructure/repositories/prisma-token.repository';
export { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
export { authSchemas } from './presentation/schemas/auth.schemas';
export { AuthSerializer } from './presentation/serializers/auth.serializer';
export type { AuthenticatedRequest } from './presentation/types/authenticated-request';
export { hashToken } from '@/shared/utils/crypto';
