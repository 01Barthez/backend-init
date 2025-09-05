export class ValidationError extends Error {
  code = 'VALIDATION_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class UploadError extends Error {
  code = 'UPLOAD_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}
