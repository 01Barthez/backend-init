import { AppError } from '@/shared/domain/errors/app-error';

import type { UploaderPort } from '../../domain/ports/uploader.port';

export type CreatePresignedUploadInput = {
  filename: string;
  contentType: string;
  size: number;
};

export type CreatePresignedUploadDeps = {
  uploader: UploaderPort;
};

/**
 * Issues a time-limited PUT URL for objects larger than the API multipart cap.
 */
export class CreatePresignedUploadCommand {
  constructor(private readonly deps: CreatePresignedUploadDeps) {}

  async execute(input: CreatePresignedUploadInput) {
    if (!input.filename || !input.contentType || !input.size) {
      throw AppError.badRequest('filename, contentType and size are required');
    }
    return this.deps.uploader.presignPut(input);
  }
}
