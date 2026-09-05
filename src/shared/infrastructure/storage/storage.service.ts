/**
 * Storage facade — selects MinIO or S3 from config and exposes bucket helpers.
 */
import fs from 'fs-extra';

import { config, envs } from '@/app/config';
import { STORAGE_BUCKETS } from '@/shared/constants/app.constants';
import log from '@/shared/infrastructure/logging/logger';
import { MinioStorageProvider } from '@/shared/infrastructure/storage/providers/minio.provider';
import { S3StorageProvider } from '@/shared/infrastructure/storage/providers/s3.provider';
import type {
  StorageProvider,
  UploadFileParams,
} from '@/shared/infrastructure/storage/storage.port';

const createProvider = (): StorageProvider => {
  const provider = envs.STORAGE_PROVIDER.toLowerCase();

  if (provider === 's3') {
    return new S3StorageProvider();
  }

  return new MinioStorageProvider();
};

class StorageService {
  private readonly provider: StorageProvider;

  constructor() {
    this.provider = createProvider();
  }

  async ensureBuckets(): Promise<void> {
    const buckets = [
      config.storage.minio.appBucket || STORAGE_BUCKETS.UPLOADS,
      config.storage.minio.backupBucket || STORAGE_BUCKETS.BACKUPS,
    ];
    await Promise.all(buckets.map((bucket) => this.provider.ensureBucket(bucket)));
    log.info('Storage buckets ensured', { buckets });
  }

  uploadFile(params: UploadFileParams): Promise<string> {
    return this.provider.uploadFile(params);
  }

  uploadBuffer(params: {
    bucket: string;
    key: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    return this.provider.uploadBuffer(params);
  }

  getPublicUrl(bucket: string, key: string): string {
    return this.provider.getPublicUrl(bucket, key);
  }

  async uploadFromPath(localPath: string, bucket: string, key: string): Promise<string> {
    const buffer = await fs.readFile(localPath);
    return this.provider.uploadBuffer({
      bucket,
      key,
      buffer,
      contentType: 'application/octet-stream',
    });
  }
}

export const storageService = new StorageService();
export default storageService;
