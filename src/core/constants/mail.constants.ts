export const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

export const MAIL = {
  OTP_SUBJECT: 'OTP Validation',
  RESET_PWD_SUBJECT: 'Reset Password',
  WELCOME_SUBJECT: 'Welcome to Our Service',
  LOGIN_ALERT_SUBJECT: 'New Login Alert',
  ACCOUNT_DELETED_SUBJECT: 'Account Deleted',
  ACCOUNT_RESTORED_SUBJECT: 'Account Restored',
  PASSWORD_CHANGED_SUBJECT: 'Password Changed',
  ROLE_CHANGED_SUBJECT: 'Role Changed',
  BACKUP_NOTIFICATION_SUBJECT_SUCCESS: 'Backup Successful',
  BACKUP_NOTIFICATION_SUBJECT_FAILED: 'Backup Failed',
} as const;
