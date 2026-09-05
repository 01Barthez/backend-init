import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreatePresignedDownloadCommand } from '@/modules/files/application/commands/create-presigned-download.command';
import type { UploaderPort } from '@/modules/files/domain/ports/uploader.port';
import { AppError } from '@/shared/domain/errors/app-error';

describe('CreatePresignedDownloadCommand ownership', () => {
  let uploader: UploaderPort;
  let command: CreatePresignedDownloadCommand;

  beforeEach(() => {
    uploader = {
      presignGet: vi.fn().mockResolvedValue({ url: 'https://minio/obj', expiresIn: 60 }),
      presignPut: vi.fn(),
      uploadBuffer: vi.fn(),
      uploadFile: vi.fn(),
    } as unknown as UploaderPort;
    command = new CreatePresignedDownloadCommand({ uploader });
  });

  it('forbids keys outside uploads/{userId}/', async () => {
    await expect(
      command.execute({ key: 'uploads/other-user/file.pdf', userId: 'user-1' }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(uploader.presignGet).not.toHaveBeenCalled();
  });

  it('issues a URL for keys owned by the caller', async () => {
    const result = await command.execute({
      key: 'uploads/user-1/file.pdf',
      userId: 'user-1',
    });

    expect(uploader.presignGet).toHaveBeenCalledWith('uploads/user-1/file.pdf');
    expect(result.url).toBe('https://minio/obj');
  });

  it('rejects empty keys', async () => {
    await expect(command.execute({ key: '  ', userId: 'user-1' })).rejects.toBeInstanceOf(AppError);
  });
});
