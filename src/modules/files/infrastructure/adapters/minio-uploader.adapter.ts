import type { UploaderPort } from '../../domain/ports/uploader.port';
import type { FileMeta, UploadOptions, UploadResult } from '../../domain/types/upload.types';
import type { MinioUploader } from '../minio-uploader';

/**
 * Adapts MinioUploader to the UploaderPort used by application commands.
 */
export class MinioUploaderAdapter implements UploaderPort {
  constructor(private readonly uploader: MinioUploader) {}

  uploadBuffer(buffer: Buffer, meta: FileMeta, opts?: UploadOptions): Promise<UploadResult> {
    return this.uploader.uploadBuffer(buffer, { ...meta, profile: opts?.profile }, opts);
  }

  presignPut(input: {
    filename: string;
    contentType: string;
    size: number;
  }): Promise<{ url: string; key: string; expiresIn: number }> {
    return this.uploader.presignPut(input);
  }

  presignGet(key: string): Promise<{ url: string; expiresIn: number }> {
    return this.uploader.presignGet(key);
  }
}
