import { QUEUE_NAMES } from '@/shared/constants/app.constants';
import { AppError } from '@/shared/domain/errors/app-error';
import type { AuditPort } from '@/shared/infrastructure/audit';
import log from '@/shared/infrastructure/logging/logger';
import { heavyTasksQueue } from '@/shared/infrastructure/queue/queue.service';

import type { UploaderPort } from '../../domain/ports/uploader.port';

export type CreatePresignedUploadInput = {
  filename: string;
  contentType: string;
  size: number;
  userId: string;
};

export type CreatePresignedUploadDeps = {
  uploader: UploaderPort;
  audit?: AuditPort;
};

/**
 * Issues a time-limited PUT URL for objects larger than the API multipart cap.
 * Keys are namespaced under uploads/{userId}/. A deferred scan job is queued
 * because the bytes never transit the API process.
 */
export class CreatePresignedUploadCommand {
  constructor(private readonly deps: CreatePresignedUploadDeps) {}

  async execute(input: CreatePresignedUploadInput) {
    if (!input.filename || !input.contentType || !input.size || !input.userId) {
      throw AppError.badRequest('filename, contentType, size and authentication are required');
    }

    const result = await this.deps.uploader.presignPut({
      filename: input.filename,
      contentType: input.contentType,
      size: input.size,
      ownerId: input.userId,
    });

    // Best-effort: scan after the client finishes the PUT (worker downloads object).
    heavyTasksQueue
      .add(
        'scan-presigned-object',
        { key: result.key, userId: input.userId },
        {
          jobId: `scan:${result.key}`,
          delay: 15_000,
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      )
      .catch((error: Error) => {
        log.warn('Failed to enqueue post-presign scan', {
          queue: QUEUE_NAMES.HEAVY_TASKS,
          key: result.key,
          error: error.message,
        });
      });

    await this.deps.audit?.record({
      actorId: input.userId,
      action: 'files.presign.upload',
      resource: 'file',
      resourceId: result.key,
      metadata: { contentType: input.contentType, size: input.size },
    });

    return result;
  }
}
