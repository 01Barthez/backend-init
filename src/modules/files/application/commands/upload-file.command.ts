import type { UploaderPort } from '../../domain/ports/uploader.port';
import type { FileMeta, UploadOptions, UploadResult } from '../../domain/types/upload.types';

export type UploadFileInput = {
  buffer: Buffer;
  meta: FileMeta;
  options?: UploadOptions;
};

export type UploadFileCommandDeps = {
  uploader: UploaderPort;
};

/**
 * Generic validated file upload (documents, covers, etc.).
 */
export class UploadFileCommand {
  constructor(private readonly deps: UploadFileCommandDeps) {}

  async execute(input: UploadFileInput): Promise<UploadResult> {
    return this.deps.uploader.uploadBuffer(input.buffer, input.meta, input.options);
  }
}
