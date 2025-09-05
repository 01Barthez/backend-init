export type UploadResult = {
  bucket: string;
  key: string;
  etag?: string;
  size?: number;
  location?: string;
  uploadId?: string; // present for multipart
};
