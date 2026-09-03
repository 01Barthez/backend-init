import { AppError } from '@/shared/domain/errors/app-error';

/**
 * Static helpers for CSRF and TOTP without inventing new HTTP statuses.
 */
export const CsrfTokenError = (): AppError =>
  new AppError(403, 'Invalid CSRF token', 'EBADCSRFTOKEN');

export const TotpRequiredError = (): AppError =>
  new AppError(401, 'TOTP code required', 'TOTP_REQUIRED');

export const TotpInvalidError = (): AppError =>
  new AppError(401, 'Invalid TOTP code', 'TOTP_INVALID');
