export interface ITemplateOTP {
  date: string;
  name: string;
  content: string;
}

export interface ITemplateResetPassword {
  date: string;
  name: string;
}

export interface ITemplateNotificationSuccess {
  date: string;
  backupPath: string;
  size: string;
  duration: string;
}

export interface ITemplateNotificationError {
  date: string;
  errorMessage: string;
  stackTrace?: string;
}

export type TemplateData = Record<string, any>; // can be extended as needed
