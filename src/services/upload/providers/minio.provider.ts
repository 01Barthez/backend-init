import type { BucketItem, Client as MinioClient } from 'minio';

import { UploadError } from '../core/Errors';
import type { Logger } from '../core/Logger';

export class MinioProvider {
  constructor(
    private client: MinioClient,
    private bucket: string,
    private logger: Logger,
  ) {}

  async putObject(key: string, data: any, size?: number, contentType?: string) {
    try {
      this.logger.info('Attempting to upload object', {
        key,
        size,
        contentType,
        bucket: this.bucket,
      });

      const metadata = {
        'Content-Type': contentType ?? 'application/octet-stream',
      };

      // For buffers, MinIO can auto-detect size, but we provide it explicitly
      await this.client.putObject(this.bucket, key, data, size, metadata);

      this.logger.info('Successfully uploaded object', { key, size });
    } catch (err: any) {
      this.logger.error('Failed to upload object', {
        key,
        bucket: this.bucket,
        error: err.message || err,
        code: err.code,
        stack: err.stack,
      });
      throw err;
    }
  }

  async ensureBucketExists() {
    try {
      this.logger.info('Checking if bucket exists', { bucket: this.bucket });
      const exists = await this.client.bucketExists(this.bucket);

      if (!exists) {
        this.logger.info('Bucket does not exist, creating', { bucket: this.bucket });
        await this.client.makeBucket(this.bucket);
        this.logger.info('Bucket created successfully', { bucket: this.bucket });
      } else {
        this.logger.info('Bucket already exists', { bucket: this.bucket });
      }
    } catch (err: any) {
      this.logger.error('Bucket check/create failed', {
        bucket: this.bucket,
        error: err.message || err,
        code: err.code,
        stack: err.stack,
      });
      throw new UploadError('bucket_check_failed', err);
    }
  }

  async list(prefix?: string): Promise<BucketItem[]> {
    return new Promise((resolve, reject) => {
      const items: BucketItem[] = [];
      const stream = this.client.listObjectsV2(this.bucket, prefix ?? '', true);
      stream.on('data', (obj: BucketItem) => items.push(obj));
      stream.on('error', (err: any) => reject(err));
      stream.on('end', () => resolve(items));
    });
  }

  async remove(key: string) {
    await this.client.removeObject(this.bucket, key);
    this.logger.info('removed object', key);
  }

  async presignedPutUrl(key: string, expiresSeconds: number) {
    return this.client.presignedPutObject(this.bucket, key, expiresSeconds);
  }

  async presignedGetUrl(key: string, expiresSeconds: number) {
    return this.client.presignedGetObject(this.bucket, key, expiresSeconds);
  }
}
