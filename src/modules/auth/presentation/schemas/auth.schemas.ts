/**
 * Auth express-validator rules (presentation layer).
 */
import { validate_user } from '@/shared/utils/validation/users.validation';

export const authSchemas = {
  signup: validate_user.signup,
  login: validate_user.login,
  verifyAccount: validate_user.verifyAccount,
  resendOtp: validate_user.resendOtp,
  forgotPassword: validate_user.forgotPassword,
  resetPassword: validate_user.resetPassword,
  changePassword: validate_user.changePassword,
};

export { validate_user };
