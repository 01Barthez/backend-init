import EventEmitter from 'events';

import log from '../logging/logger';
import { UploadError, ValidationError } from './core/Errors';
import { defaultLogger } from './core/Logger';
import type { Logger } from './core/Logger';
import type { UploadResult } from './core/UploadResult';
import { generateFilePath, sleep } from './core/Utils';
import type { FileMeta, ValidationPolicy } from './core/ValidationPolicy';
import { MinioProvider } from './providers/MinioProvider';
import type { Scanner } from './scanner/Scanner';
import { MultipartService } from './services/MultipartService';
import { PresignedUrlService } from './services/PresignedUrlService';
import { Validator } from './validation/Validator';

export class MinioUploader extends EventEmitter {
  private validator: Validator;
  private provider: MinioProvider;
  private multipart: MultipartService;
  private presigned: PresignedUrlService;
  private scanner?: Scanner;
  private maxRetries: number;

  constructor(config: {
    client: any;
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
      config.defaultPolicy ?? { maxSizeBytes: 50 * 1024 * 1024 },
      config.profiles,
    );
    this.provider = new MinioProvider(
      config.client,
      config.bucket,
      config.logger ?? defaultLogger(),
    );
    this.multipart = new MultipartService(config.client, config.bucket);
    this.presigned = new PresignedUrlService(this.provider);
    this.scanner = config.scanner;
    this.maxRetries = config.maxRetries ?? 3;
  }

  async uploadBuffer(buffer: Buffer, meta: FileMeta): Promise<UploadResult> {
    const startTime = Date.now();
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    log.info('Starting file upload', {
      uploadId,
      filename: meta.filename,
      size: buffer.length,
      contentType: meta.contentType,
    });

    try {
      // 1. Validation du fichier
      this.validator.validate(meta);

      // 2. Scan antivirus
      if (this.scanner) {
        log.debug('Starting virus scan', { uploadId });
        const scanResult = await this.scanner.scan(buffer, meta.filename);

        if (!scanResult.ok) {
          log.warn('Virus scan failed', {
            uploadId,
            reason: scanResult.reason,
            threat: scanResult.threat,
            duration: Date.now() - startTime,
          });

          throw new ValidationError(
            `virus_scan_failed: ${scanResult.threat || 'File is potentially malicious'}`,
            scanResult,
          );
        }
        log.debug('Virus scan completed', { uploadId, duration: scanResult.scanDuration });
      }

      // 3. Génération du chemin de fichier
      const { key, path } = generateFilePath(meta.filename);

      // 4. Upload vers MinIO
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
        scanResult: this.scanner ? 'clean' : 'not_scanned',
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
        throw error; // Laissez le gestionnaire d'erreurs global gérer ça
      }

      throw new UploadError(`upload_failed: ${errorMessage}`, error);
    }
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: any;

    while (true) {
      try {
        log.debug(`Retry attempt ${attempt + 1}/${this.maxRetries}`);
        return fn();
      } catch (err: any) {
        lastError = err;
        attempt++;

        log.warn('Retry attempt failed', {
          attempt,
          maxRetries: this.maxRetries,
          error: err.message || err,
          code: err.code,
        });

        if (attempt > this.maxRetries) {
          log.error('Max retries exceeded', {
            attempts: attempt,
            lastError: lastError.message || lastError,
            code: lastError.code,
          });
          throw new UploadError('max_retries_exceeded', lastError);
        }

        const delay = 200 * attempt;
        log.debug(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }
}
