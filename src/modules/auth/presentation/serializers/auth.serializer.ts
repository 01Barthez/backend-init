import type { EnrollTotpResult } from '../../application/commands/enroll-totp.command';
import type { LoginResult, SignupResult } from '../../application/dto/auth.dto';
import type { GetCurrentUserResult } from '../../application/queries/get-current-user.query';
import type { AuthSessionSummary } from '../../domain/types/auth.types';

/**
 * Maps use-case results to the public API response shape.
 * Keeps password hashes and internal token JTIs out of JSON bodies.
 */
export const AuthSerializer = {
  login(result: LoginResult) {
    return {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      phone: result.phone,
      profileUrl: result.profileUrl,
      roles: result.roles,
      permissions: result.permissions,
    };
  },

  signup(result: SignupResult) {
    return {
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      phone: result.phone,
      profileUrl: result.profileUrl,
      otp: result.otp,
    };
  },

  refresh(accessToken: string) {
    return { accessToken };
  },

  verifyOtp(email: string) {
    return { email };
  },

  resendOtp(emailSent: boolean) {
    return { emailSent };
  },

  forgotPassword(emailSent: boolean) {
    return { emailSent };
  },

  me(profile: GetCurrentUserResult) {
    return profile;
  },

  sessions(items: AuthSessionSummary[]) {
    return items;
  },

  totpEnroll(result: EnrollTotpResult) {
    return {
      otpauthUrl: result.otpauthUrl,
      secret: result.secret,
    };
  },
};
