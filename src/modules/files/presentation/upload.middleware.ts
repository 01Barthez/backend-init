/**
 * Multer memory middleware for multipart uploads (avatars).
 * Large objects must use presigned PUT — keep this cap aligned with API_UPLOAD_MAX_BYTES.
 */
import multer from 'multer';

import { config } from '@/app/config';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.storage.upload.apiMaxBytes },
});
