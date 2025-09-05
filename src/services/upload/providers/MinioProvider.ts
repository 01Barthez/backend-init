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
    await this.client.putObject(this.bucket, key, data, size, {
      'Content-Type': contentType ?? 'application/octet-stream',
    });
    this.logger.info('uploaded object', key);
  }

  async ensureBucketExists() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        this.logger.info('bucket not exists, creating', this.bucket);
        await this.client.makeBucket(this.bucket);
      }
    } catch (err) {
      this.logger.error('bucket check/create failed', err);
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
