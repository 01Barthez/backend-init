import type { Readable } from 'stream';

import { UploadError } from '../core/Errors';

export class MultipartService {
  constructor(
    private client: any,
    private bucket: string,
  ) {}

  async createMultipartUpload(key: string, contentType?: string): Promise<string> {
    if (typeof this.client.createMultipartUpload === 'function') {
      const res = await this.client.createMultipartUpload({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadId = res.UploadId || res.uploadId;
      if (!uploadId) throw new UploadError('create_multipart_failed', res);
      return uploadId;
    }
    throw new UploadError('create_multipart_not_supported_by_client');
  }

  async uploadPart(key: string, uploadId: string, partNumber: number, body: Buffer | Readable) {
    if (typeof this.client.uploadPart === 'function') {
      const res = await this.client.uploadPart({
        Bucket: this.bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: body,
      });
      return { ETag: res.ETag, PartNumber: partNumber };
    }
    throw new UploadError('upload_part_not_supported_by_client');
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
  ) {
    if (typeof this.client.completeMultipartUpload === 'function') {
      return this.client.completeMultipartUpload({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      });
    }
    throw new UploadError('complete_multipart_not_supported_by_client');
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    if (typeof this.client.abortMultipartUpload === 'function') {
      return this.client.abortMultipartUpload({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      });
    }
    throw new UploadError('abort_multipart_not_supported_by_client');
  }
}
