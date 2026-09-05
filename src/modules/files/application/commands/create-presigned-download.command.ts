import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';

import type { UploaderPort } from '../../domain/ports/uploader.port';

export type CreatePresignedDownloadDeps = {
  uploader: UploaderPort;
  audit?: AuditPort;
};

export type CreatePresignedDownloadInput = {
  key: string;
  /** Authenticated caller — object keys are namespaced under uploads/{userId}/. */
  userId: string;
};

/**
 * Issues a time-limited GET URL for an object owned by the caller.
 */
export class CreatePresignedDownloadCommand {
  constructor(private readonly deps: CreatePresignedDownloadDeps) {}

  async execute(input: CreatePresignedDownloadInput) {
    const key = input.key?.trim();
    if (!key) {
      throw AppError.badRequest('Object key is required');
    }

    const prefix = `uploads/${input.userId}/`;
    if (!key.startsWith(prefix)) {
      throw AppError.forbidden('You do not have access to this object');
    }

    const result = await this.deps.uploader.presignGet(key);

    await this.deps.audit?.record({
      actorId: input.userId,
      action: 'files.presign.download',
      resource: 'file',
      resourceId: key,
    });

    return result;
  }
}
