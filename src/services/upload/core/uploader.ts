import type { BucketItem } from 'minio';
import type { Readable } from 'stream';

import type { UploadResult } from './UploadResult';
import type { FileMeta } from './ValidationPolicy';

export interface Uploader {
  uploadBuffer(buffer: Buffer, meta: FileMeta, opts?: UploadOptions): Promise<UploadResult>;
  uploadStream(stream: Readable, meta: FileMeta, opts?: UploadOptions): Promise<UploadResult>;
  list(prefix?: string): Promise<BucketItem[]>;
  remove(key: string): Promise<void>;
}

export type UploadOptions = {
  profile?: string;
  prefix?: string;
  datePartition?: boolean;
  transform?: (buf: Buffer) => Promise<Buffer>;
  transformStream?: (s: Readable) => Readable;
};
