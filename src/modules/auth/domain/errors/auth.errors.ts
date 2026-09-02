import { AppError } from '@/shared/domain/errors/app-error';

/**
 * Auth-specific errors. Prefer these over generic AppError in use cases
 * so presentation / logs can distinguish failure modes if needed.
 */
export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid login credentials') {
    super(401, message, 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountNotVerifiedError extends AppError {
  constructor(message = 'Please verify your account first') {
    super(403, message, 'ACCOUNT_NOT_VERIFIED');
    this.name = 'AccountNotVerifiedError';
  }
}

export class AccountInactiveError extends AppError {
  constructor(message = 'Account is inactive') {
    super(403, message, 'ACCOUNT_INACTIVE');
    this.name = 'AccountInactiveError';
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = 'Email already exists') {
    super(409, message, 'EMAIL_ALREADY_EXISTS');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidOtpError extends AppError {
  constructor(message = 'Invalid OTP code') {
    super(403, message, 'INVALID_OTP');
    this.name = 'InvalidOtpError';
  }
}

export class OtpExpiredError extends AppError {
  constructor(message = 'OTP has expired') {
    super(403, message, 'OTP_EXPIRED');
    this.name = 'OtpExpiredError';
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message = 'Invalid or expired refresh token') {
    super(401, message, 'INVALID_REFRESH_TOKEN');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class InvalidResetTokenError extends AppError {
  constructor(message = 'Invalid or expired reset token') {
    super(422, message, 'INVALID_RESET_TOKEN');
    this.name = 'InvalidResetTokenError';
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Too many failed attempts. Try again later') {
    super(429, message, 'ACCOUNT_LOCKED');
    this.name = 'AccountLockedError';
  }
}

export class IncorrectPasswordError extends AppError {
  constructor(message = 'Current password is incorrect') {
    super(403, message, 'INCORRECT_PASSWORD');
    this.name = 'IncorrectPasswordError';
  }
}
