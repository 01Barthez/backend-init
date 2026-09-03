export type FileMeta = {
  filename: string;
  contentType?: string;
  size?: number;
  /** Object key prefix inside the bucket, e.g. users/avatars */
  category?: string;
  /** Validation profile name (e.g. `avatar`). */
  profile?: string;
};

export type ValidationPolicy = {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
};
