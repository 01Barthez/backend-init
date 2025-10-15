export const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

export const MAIL = {
  OTP_SUBJECT: 'OTP Validation',
} as const;
