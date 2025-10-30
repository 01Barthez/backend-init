export const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

export const MAIL = {
  OTP_SUBJECT: 'OTP Validation',
  RESET_PWD_SUBJECT: 'Reset Password',
  WELCOME_SUBJECT: 'Welcome to Our Service',
  LOGIN_ALERT_SUBJECT: 'New Login Alert',
  BACKUP_NOTIFICATION_SUBJECT_SUCCESS: 'Backup Successful',
  BACKUP_NOTIFICATION_SUBJECT_FAILED: 'Backup Failed',
} as const;
