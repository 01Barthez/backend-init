export const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

export const MAIL = {
  OTP_SUBJECT: 'OTP Validation',
  RESET_PWD_SUBJECT: 'Reset Password',
  WELCOME_SUBJECT: 'Welcome to Our Service',
  LOGIN_ALERT_SUBJECT: 'New Login Alert',
} as const;
