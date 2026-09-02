import fs from 'fs-extra';
import { Client } from 'minio';

import { envs } from '@/config/env/env';
import type {
  StorageProvider,
  UploadBufferParams,
  UploadFileParams,
} from '@/services/storage/storage.interface';

const client = new Client({
  endPoint: envs.MINIO_ENDPOINT,
  port: envs.MINIO_PORT,
  useSSL: envs.MINIO_USE_SSL,
  accessKey: envs.MINIO_ACCESS_KEY,
  secretKey: envs.MINIO_SECRET_KEY,
});

export class MinioStorageProvider implements StorageProvider {
  async ensureBucket(bucket: string): Promise<void> {
    const exists = await client.bucketExists(bucket);
    if (!exists) {
      await client.makeBucket(bucket, '');
    }
  }

  async uploadFile(params: UploadFileParams): Promise<string> {
    const buffer = await fs.readFile(params.filePath);
    return this.uploadBuffer({
      bucket: params.bucket,
      key: params.key,
      buffer,
      contentType: params.contentType ?? 'application/octet-stream',
    });
  }

  async uploadBuffer(params: UploadBufferParams): Promise<string> {
    await this.ensureBucket(params.bucket);
    await client.putObject(params.bucket, params.key, params.buffer, params.buffer.length, {
      'Content-Type': params.contentType,
    });
    return this.getPublicUrl(params.bucket, params.key);
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await client.removeObject(bucket, key);
  }

  getPublicUrl(bucket: string, key: string): string {
    if (envs.MINIO_PUBLIC_URL) {
      return `${envs.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${bucket}/${key}`;
    }

    const protocol = envs.MINIO_USE_SSL ? 'https' : 'http';
    const host =
      envs.MINIO_ENDPOINT === 'minio' ? 'localhost' : envs.MINIO_ENDPOINT;
    return `${protocol}://${host}:${envs.MINIO_PORT}/${bucket}/${key}`;
  }
}

export default MinioStorageProvider;
