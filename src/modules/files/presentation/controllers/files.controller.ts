import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { CreatePresignedDownloadCommand } from '../../application/commands/create-presigned-download.command';
import type { CreatePresignedUploadCommand } from '../../application/commands/create-presigned-upload.command';

type AuthenticatedRequest = Request & { user?: { id: string } };

export type FilesControllerDeps = {
  createPresignedUpload: CreatePresignedUploadCommand;
  createPresignedDownload: CreatePresignedDownloadCommand;
};

export function createFilesController(deps: FilesControllerDeps) {
  const createUploadUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await deps.createPresignedUpload.execute({
      filename: req.body.filename,
      contentType: req.body.contentType,
      size: Number(req.body.size),
      userId: req.user!.id,
    });
    return response.ok(req, res, result, 'Presigned upload URL');
  });

  const createDownloadUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await deps.createPresignedDownload.execute({
      key: String(req.query.key ?? ''),
      userId: req.user!.id,
    });
    return response.ok(req, res, result, 'Presigned download URL');
  });

  return { createUploadUrl, createDownloadUrl };
}

export type FilesController = ReturnType<typeof createFilesController>;
