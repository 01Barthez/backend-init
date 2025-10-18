export interface ITemplateOTP {
  date: string;
  name: string;
  content: string;
}

export interface ITemplateResetPassword {
  date: string;
  name: string;
}

export type TemplateData = Record<string, any>; // Peut être affiné selon tes besoins
