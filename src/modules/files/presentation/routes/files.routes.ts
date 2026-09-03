import { Router } from 'express';

import {
  authenticate,
  requireActive,
  requireVerified,
} from '@/app/middleware/authenticate.middleware';
import { validationErrorHandler } from '@/app/middleware/validation-error.middleware';

import type { FilesController } from '../controllers/files.controller';
import { filesSchemas } from '../schemas/files.schemas';

/**
 * Files HTTP routes — mounted at `/api/v1/files`.
 * Multipart avatars stay on auth/users; this surface is presigned large-object I/O.
 */
export function createFilesRoutes(controller: FilesController): Router {
  const files = Router();

  files.post(
    '/presign',
    authenticate,
    requireVerified,
    requireActive,
    filesSchemas.presignPut,
    validationErrorHandler,
    controller.createUploadUrl,
  );

  files.get(
    '/presign',
    authenticate,
    requireVerified,
    requireActive,
    filesSchemas.presignGet,
    validationErrorHandler,
    controller.createDownloadUrl,
  );

  return files;
}
