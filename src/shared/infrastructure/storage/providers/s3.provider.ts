import fs from 'fs-extra';
import { Client } from 'minio';

import { envs } from '@/app/config';
import type {
  StorageProvider,
  UploadBufferParams,
  UploadFileParams,
} from '@/shared/infrastructure/storage/storage.port';

/**
 * S3-compatible provider (AWS S3, MinIO gateway, SeaweedFS, etc.).
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      endPoint: envs.S3_ENDPOINT || envs.MINIO_ENDPOINT,
      port: envs.S3_PORT || envs.MINIO_PORT,
      useSSL: envs.S3_USE_SSL ?? envs.MINIO_USE_SSL,
      accessKey: envs.S3_ACCESS_KEY || envs.MINIO_ACCESS_KEY,
      secretKey: envs.S3_SECRET_KEY || envs.MINIO_SECRET_KEY,
      region: envs.S3_REGION || 'us-east-1',
    });
  }

  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) await this.client.makeBucket(bucket, envs.S3_REGION || 'us-east-1');
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
    await this.client.putObject(params.bucket, params.key, params.buffer, params.buffer.length, {
      'Content-Type': params.contentType,
    });
    return this.getPublicUrl(params.bucket, params.key);
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  getPublicUrl(bucket: string, key: string): string {
    if (envs.S3_PUBLIC_URL) {
      return `${envs.S3_PUBLIC_URL}/${bucket}/${key}`;
    }
    const protocol = (envs.S3_USE_SSL ?? envs.MINIO_USE_SSL) ? 'https' : 'http';
    const endpoint = envs.S3_ENDPOINT || envs.MINIO_ENDPOINT;
    const port = envs.S3_PORT || envs.MINIO_PORT;
    return `${protocol}://${endpoint}:${port}/${bucket}/${key}`;
  }
}

export default S3StorageProvider;
