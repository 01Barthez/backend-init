import type { MinioProvider } from '../providers/MinioProvider';

export class PresignedUrlService {
  constructor(private provider: MinioProvider) {}

  async presignedPut(filename: string, key: string, expiresSeconds = 300) {
    const url = await this.provider.presignedPutUrl(key, expiresSeconds);
    return { url, key };
  }

  async presignedGet(key: string, expiresSeconds = 3600) {
    return this.provider.presignedGetUrl(key, expiresSeconds);
  }
}
