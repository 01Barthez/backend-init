import EventEmitter from 'events';

import { UploadError, ValidationError } from './core/Errors';
import { defaultLogger } from './core/Logger';
import type { Logger } from './core/Logger';
import type { UploadResult } from './core/UploadResult';
import { sleep } from './core/Utils';
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
  private logger: Logger;

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
    this.logger = config.logger ?? defaultLogger();
  }

  async uploadBuffer(buffer: Buffer, meta: FileMeta): Promise<UploadResult> {
    this.validator.validate(meta);

    if (this.scanner) {
      const scan = await this.scanner.scan(buffer, meta.filename);
      if (!scan.ok) throw new ValidationError('virus_detected', scan);
    }

    const key = meta.filename; // simplifié
    return this.retry(async () => {
      await this.provider.ensureBucketExists();
      await this.provider.putObject(key, buffer, buffer.length, meta.contentType);
      this.emit('uploaded', { key, bucket: 'bucket', size: buffer.length });
      return { bucket: 'bucket', key, size: buffer.length, location: key };
    });
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt > this.maxRetries) throw new UploadError('max_retries_exceeded', err);
        await sleep(200 * attempt);
      }
    }
  }
}
