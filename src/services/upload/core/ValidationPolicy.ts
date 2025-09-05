export type FileMeta = {
  filename: string;
  contentType?: string;
  size?: number; // bytes (if known)
};

export type ValidationPolicy = {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
};
