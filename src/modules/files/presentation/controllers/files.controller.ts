import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/shared/utils/http/responses/helpers';

import type { CreatePresignedDownloadCommand } from '../../application/commands/create-presigned-download.command';
import type { CreatePresignedUploadCommand } from '../../application/commands/create-presigned-upload.command';

export type FilesControllerDeps = {
  createPresignedUpload: CreatePresignedUploadCommand;
  createPresignedDownload: CreatePresignedDownloadCommand;
};

export function createFilesController(deps: FilesControllerDeps) {
  const createUploadUrl = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.createPresignedUpload.execute({
      filename: req.body.filename,
      contentType: req.body.contentType,
      size: Number(req.body.size),
    });
    return response.ok(req, res, result, 'Presigned upload URL');
  });

  const createDownloadUrl = asyncHandler(async (req: Request, res: Response) => {
    const result = await deps.createPresignedDownload.execute(String(req.query.key ?? ''));
    return response.ok(req, res, result, 'Presigned download URL');
  });

  return { createUploadUrl, createDownloadUrl };
}

export type FilesController = ReturnType<typeof createFilesController>;
