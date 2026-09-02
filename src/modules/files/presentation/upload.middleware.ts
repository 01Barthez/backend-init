/**
 * Multer memory middleware for multipart uploads (avatars, documents).
 * Lives under files module so consumers import from `@/modules/files`.
 */
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});
