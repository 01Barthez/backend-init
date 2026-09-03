import EventEmitter from 'events';

import { config } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

import { UploadError, ValidationError } from './core/errors';
import { defaultLogger } from './core/logger';
import type { Logger } from './core/logger';
import type { UploadResult } from './core/upload-result';
import { generateFilePath, sleep } from './core/utils';
import type { FileMeta, ValidationPolicy } from './core/validation-policy';
import { MinioProvider } from './providers/minio.provider';
import type { Scanner } from './scanner/scanner';
import { PresignedUrlService } from './services/presigned-url.service';
import { Validator } from './validation/validator';

export class MinioUploader extends EventEmitter {
  private validator: Validator;
  private provider: MinioProvider;
  private presigned: PresignedUrlService;
  private scanner?: Scanner;
  private maxRetries: number;

  constructor(configInput: {
    client: unknown;
    bucket: string;
    basePath?: string;
    defaultPolicy?: ValidationPolicy;
    profiles?: Record<string, ValidationPolicy>;
    maxRetries?: number;
    scanner?: Scanner;
    logger?: Logger;
  }) {
    super();
    this.validator = new Validator(
      configInput.defaultPolicy ?? { maxSizeBytes: 50 * 1024 * 1024 },
      configInput.profiles,
    );
    this.provider = new MinioProvider(
      configInput.client as never,
      configInput.bucket,
      configInput.logger ?? defaultLogger(),
    );
    this.presigned = new PresignedUrlService(this.provider);
    this.scanner = configInput.scanner;
    this.maxRetries = configInput.maxRetries ?? 3;
  }

  async uploadBuffer(
    buffer: Buffer,
    meta: FileMeta,
    opts?: { profile?: string },
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const profile = opts?.profile ?? meta.profile;

    log.info('Starting file upload', {
      uploadId,
      filename: meta.filename,
      size: buffer.length,
      contentType: meta.contentType,
      profile,
    });

    try {
      await this.validator.validate(meta, buffer, profile);

      let scanResult: UploadResult['scanResult'] = 'not_scanned';
      if (this.scanner) {
        try {
          const scanned = await this.scanner.scan(buffer, meta.filename);
          if (!scanned.ok) {
            throw new ValidationError(
              `virus_scan_failed: ${scanned.threat || 'File is potentially malicious'}`,
              scanned,
            );
          }
          scanResult = 'clean';
        } catch (error: unknown) {
          if (error instanceof ValidationError) throw error;
          if (config.storage.clamav.required) {
            throw error;
          }
          log.warn('ClamAV unavailable — continuing without scan', {
            uploadId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const { key, path } = generateFilePath(meta.filename, meta.category ?? 'misc');

      await this.retry(async () => {
        await this.provider.ensureBucketExists();
        await this.provider.putObject(key, buffer, buffer.length, meta.contentType);
      });

      const result: UploadResult = {
        bucket: this.provider['bucket'],
        key,
        path,
        size: buffer.length,
        originalName: meta.filename,
        mimeType: meta.contentType ?? '',
        uploadedAt: new Date().toISOString(),
        uploadDuration: Date.now() - startTime,
        scanResult,
      };

      log.info('File uploaded successfully', {
        uploadId,
        key,
        size: buffer.length,
        duration: result.uploadDuration,
      });

      this.emit('uploaded', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Upload failed', {
        uploadId,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new UploadError(`upload_failed: ${errorMessage}`, error);
    }
  }

  async presignPut(input: {
    filename: string;
    contentType: string;
    size: number;
  }): Promise<{ url: string; key: string; expiresIn: number }> {
    const max = config.storage.upload.presignMaxBytes;
    if (input.size > max) {
      throw new ValidationError('file_too_large', { max, actual: input.size });
    }

    await this.validator.validate(
      {
        filename: input.filename,
        contentType: input.contentType,
        size: input.size,
      },
      undefined,
      undefined,
    );

    const { key } = generateFilePath(input.filename, 'uploads');
    const expiresIn = config.storage.upload.presignTtlSeconds;
    const url = await this.presigned.presignedPut(input.filename, key, expiresIn);
    return { url: url.url, key, expiresIn };
  }

  async presignGet(key: string): Promise<{ url: string; expiresIn: number }> {
    if (!key || key.includes('..') || !/^[a-zA-Z0-9/_.-]+$/.test(key)) {
      throw new ValidationError('invalid_object_key', { key });
    }
    const expiresIn = config.storage.upload.presignTtlSeconds;
    const url = await this.presigned.presignedGet(key, expiresIn);
    return { url, expiresIn };
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (true) {
      try {
        return fn();
      } catch (err: unknown) {
        lastError = err;
        attempt++;
        const message = err instanceof Error ? err.message : String(err);

        log.warn('Retry attempt failed', {
          attempt,
          maxRetries: this.maxRetries,
          error: message,
        });

        if (attempt > this.maxRetries) {
          throw new UploadError('max_retries_exceeded', lastError);
        }

        const delay = 200 * attempt;
        // eslint-disable-next-line no-await-in-loop -- intentional backoff between retries
        await sleep(delay);
      }
    }
  }
}
