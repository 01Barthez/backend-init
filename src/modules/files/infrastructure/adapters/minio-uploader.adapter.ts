import type { UploaderPort } from '../../domain/ports/uploader.port';
import type { FileMeta, UploadOptions, UploadResult } from '../../domain/types/upload.types';
import type { MinioUploader } from '../minio-uploader';

/**
 * Adapts MinioUploader to the UploaderPort used by application commands.
 */
export class MinioUploaderAdapter implements UploaderPort {
  constructor(private readonly uploader: MinioUploader) {}

  uploadBuffer(buffer: Buffer, meta: FileMeta, _opts?: UploadOptions): Promise<UploadResult> {
    return this.uploader.uploadBuffer(buffer, meta);
  }
}
