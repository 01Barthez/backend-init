import { AppError } from '@/shared/domain/errors/app-error';

export class FileValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'FILE_VALIDATION_ERROR', details);
    this.name = 'FileValidationError';
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, message, 'FILE_UPLOAD_ERROR', details);
    this.name = 'FileUploadError';
  }
}

export class VirusDetectedError extends AppError {
  constructor(message = 'File is potentially malicious', details?: unknown) {
    super(400, message, 'VIRUS_DETECTED', details);
    this.name = 'VirusDetectedError';
  }
}
