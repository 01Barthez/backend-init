import fs from 'fs-extra';

import { envs } from '@/config/env/env';
import { STORAGE_BUCKETS } from '@/core/constants/app.constants';
import log from '@/services/logging/logger';
import { MinioStorageProvider } from '@/services/storage/providers/minio.provider';
import { S3StorageProvider } from '@/services/storage/providers/s3.provider';
import type { StorageProvider, UploadFileParams } from '@/services/storage/storage.interface';

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
    await Promise.all(
      Object.values(STORAGE_BUCKETS).map((bucket) => this.provider.ensureBucket(bucket)),
    );
    log.info('Storage buckets ensured');
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
