// src/middleware/upload.ts
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(), // les fichiers seront en mémoire (Buffer)
  limits: { fileSize: 500 * 1024 * 1024 }, // Global limit: (500 MB)
});
