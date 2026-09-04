import { AppError } from '@/shared/domain/errors/app-error';

/** Client-side upload validation failure (MIME, size, extension, magic bytes). */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UploadError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, message, 'UPLOAD_ERROR', details);
    this.name = 'UploadError';
  }
}
