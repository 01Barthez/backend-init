/**
 * Auth use-case input / output DTOs.
 * Presentation maps HTTP bodies ↔ these shapes; domain entities stay internal.
 */

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profileUrl?: string | null;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

export type SignupInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  /** Optional avatar buffer from multipart upload (presentation extracts req.file). */
  avatarFile?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
};

export type SignupResult = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileUrl: string;
  otp: { otpExpireDate: Date };
};

export type LogoutInput = {
  userId: string;
  refreshToken?: string;
  accessJti?: string;
  accessExpiresAt?: Date;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type RefreshTokenResult = {
  accessToken: string;
  refreshToken: string;
};

export type VerifyOtpInput = {
  email: string;
  otp: string;
};

export type VerifyOtpResult = {
  email: string;
};

export type ResendOtpInput = {
  email: string;
};

export type ResendOtpResult = {
  emailSent: boolean;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResult = {
  emailSent: boolean;
  /** Always true in the public message path to avoid email enumeration. */
  message: string;
};

export type ResetPasswordInput = {
  resetToken: string;
  newPassword: string;
};

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};
