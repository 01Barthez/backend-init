/**
 * BullMQ workers bootstrap.
 * Backup handler lives in `@/modules/backup`; mail stays in shared infrastructure.
 */
import { Worker } from 'bullmq';

import { config, envs } from '@/app/config';
import { blacklistProvider } from '@/modules/auth';
import { runMongoBackup } from '@/modules/backup';
import { ClamAVScanner, MinioProvider, minioClient } from '@/modules/files';
import { QUEUE_NAMES, STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import { auditRepository } from '@/shared/infrastructure/audit';
import { redisLockService, withDistributedLock } from '@/shared/infrastructure/lock';
import log from '@/shared/infrastructure/logging/logger';
import { sendMailDirect } from '@/shared/infrastructure/mail/mail.service';
import type { MailJobPayload } from '@/shared/infrastructure/mail/mail.types';
import { purgeUnverifiedUsers } from '@/shared/infrastructure/maintenance/user-cleanup.service';
import { redisConnection } from '@/shared/infrastructure/queue/queue.service';

/** Lock TTL must exceed worst-case job duration to prevent overlap. */
const BACKUP_LOCK_TTL_MS = 30 * 60 * 1000;
const MAINTENANCE_LOCK_TTL_MS = 15 * 60 * 1000;

const minioWorkerLogger = {
  info: (message: string, meta?: object) => (meta ? log.info(message, meta) : log.info(message)),
  warn: (message: string, meta?: object) => (meta ? log.warn(message, meta) : log.warn(message)),
  error: (message: string, meta?: object) => (meta ? log.error(message, meta) : log.error(message)),
};

const workers: Worker[] = [];
let workersStarted = false;

const isObjectNotFound = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'NoSuchKey' || code === 'NotFound' || code === 'NoSuchObject';
};

const scanPresignedObject = async (data: { key?: string; userId?: string }): Promise<void> => {
  const key = data.key?.trim();
  if (!key) {
    log.warn('scan-presigned-object job missing key — acknowledging');
    return;
  }

  const bucket = envs.MINIO_APP_BUCKET || STORAGE_BUCKETS.UPLOADS;
  const provider = new MinioProvider(minioClient, bucket, minioWorkerLogger);

  let buffer: Buffer;
  try {
    buffer = await provider.getObjectBuffer(key);
  } catch (error: unknown) {
    if (isObjectNotFound(error)) {
      // Client may not have finished the PUT yet — BullMQ will retry.
      throw error;
    }
    throw error;
  }

  const filename = key.split('/').pop() || key;
  const clamavRequired = config.storage.clamav.required;

  if (config.app.isTest) {
    return;
  }

  const scanner = new ClamAVScanner();
  try {
    const available = await scanner.isAvailable();
    if (!available) {
      if (clamavRequired) {
        await provider.remove(key);
        log.error('ClamAV unavailable with CLAMAV_REQUIRED — removed unscanned object', {
          key,
          userId: data.userId,
        });
      } else {
        log.warn('ClamAV unavailable — leaving presigned object unscanned', {
          key,
          userId: data.userId,
        });
      }
      return;
    }

    const result = await scanner.scan(buffer, filename);
    if (!result.ok) {
      await provider.remove(key);
      log.warn('Virus detected in presigned object — removed', {
        key,
        userId: data.userId,
        threat: result.threat,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (clamavRequired) {
      await provider.remove(key);
      log.error('Presigned object scan failed with CLAMAV_REQUIRED — removed', {
        key,
        userId: data.userId,
        error: message,
      });
      return;
    }
    log.warn('Presigned object scan failed (fail-open)', {
      key,
      userId: data.userId,
      error: message,
    });
  }
};

export const startWorkers = (): void => {
  if (workersStarted) return;
  if (config.app.processRole === 'api') {
    log.info('Skipping workers (PROCESS_ROLE=api)');
    return;
  }

  workersStarted = true;

  workers.push(
    new Worker<MailJobPayload>(
      QUEUE_NAMES.MAIL,
      async (job) => {
        await sendMailDirect(job.data);
        log.info('Mail job completed', {
          jobId: job.id,
          to: job.data.to,
          requestId: job.data.requestId,
        });
      },
      { connection: redisConnection, concurrency: 5 },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.BACKUP,
      async () => {
        await withDistributedLock(redisLockService, 'job:mongodb-backup', BACKUP_LOCK_TTL_MS, () =>
          runMongoBackup(),
        );
      },
      { connection: redisConnection, concurrency: 1 },
    ),
  );

  workers.push(
    new Worker(
      QUEUE_NAMES.MAINTENANCE,
      async (job) => {
        if (job.name === 'purge-unverified-users') {
          await withDistributedLock(
            redisLockService,
            'job:purge-unverified-users',
            MAINTENANCE_LOCK_TTL_MS,
            () => purgeUnverifiedUsers(),
          );
        }
        if (job.name === 'purge-blacklist') {
          await withDistributedLock(
            redisLockService,
            'job:purge-blacklist',
            MAINTENANCE_LOCK_TTL_MS,
            () => blacklistProvider.purgeExpired(),
          );
        }
        if (job.name === 'purge-audit-logs') {
          await withDistributedLock(
            redisLockService,
            'job:purge-audit-logs',
            MAINTENANCE_LOCK_TTL_MS,
            () => auditRepository.purgeOlderThan(config.queue.auditRetentionDays),
          );
        }
      },
      { connection: redisConnection, concurrency: 1 },
    ),
  );

  /**
   * Heavy / async exports (users, audit) — stub handlers for now.
   * TODO: write JSON/CSV to MinIO and notify the requester; API returns 202 + job id
   * when sync row count would exceed the 2000-row cap.
   */
  workers.push(
    new Worker(
      QUEUE_NAMES.HEAVY_TASKS,
      async (job) => {
        switch (job.name) {
          case 'scan-presigned-object':
            await scanPresignedObject(job.data as { key?: string; userId?: string });
            return;
          case 'export-users':
          case 'export-audit':
            log.info('Heavy export job acknowledged (not yet implemented)', {
              jobId: job.id,
              name: job.name,
              data: job.data,
            });
            return;
          default:
            log.warn('Unknown heavy-tasks job — acknowledging no-op', {
              jobId: job.id,
              name: job.name,
            });
        }
      },
      { connection: redisConnection, concurrency: 2 },
    ),
  );

  log.info('BullMQ workers started');
};

export const stopWorkers = async (): Promise<void> => {
  await Promise.all(workers.map((worker) => worker.close()));
  workers.length = 0;
  workersStarted = false;
};

export default startWorkers;
