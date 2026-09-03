import { AppError } from '@/shared/domain/errors/app-error';

import type { UploaderPort } from '../../domain/ports/uploader.port';

export type CreatePresignedDownloadDeps = {
  uploader: UploaderPort;
};

/**
 * Issues a time-limited GET URL for an object the caller already knows the key of.
 */
export class CreatePresignedDownloadCommand {
  constructor(private readonly deps: CreatePresignedDownloadDeps) {}

  async execute(key: string) {
    if (!key) {
      throw AppError.badRequest('Object key is required');
    }
    return this.deps.uploader.presignGet(key);
  }
}
