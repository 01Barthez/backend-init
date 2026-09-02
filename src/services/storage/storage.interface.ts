export interface UploadFileParams {
  bucket: string;
  key: string;
  filePath: string;
  contentType?: string;
}

export interface UploadBufferParams {
  bucket: string;
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface StorageProvider {
  ensureBucket(bucket: string): Promise<void>;
  uploadFile(params: UploadFileParams): Promise<string>;
  uploadBuffer(params: UploadBufferParams): Promise<string>;
  deleteObject(bucket: string, key: string): Promise<void>;
  getPublicUrl(bucket: string, key: string): string;
}
