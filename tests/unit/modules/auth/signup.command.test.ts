import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignupCommand } from '@/modules/auth/application/commands/signup.command';
import type { AvatarUploaderPort } from '@/modules/auth/application/services/avatar-uploader.port';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import { EmailAlreadyExistsError } from '@/modules/auth/domain/errors/auth.errors';
import type { UserRepositoryPort } from '@/modules/auth/domain/repositories/user.repository';
import { hashPassword } from '@/shared/utils/crypto';
import { buildSignupPayload, buildUserEntity } from '../../../factories/user.factory';

vi.mock('@/shared/utils/crypto', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
  hashToken: (value: string) => `hash:${value}`,
  tokenHashesEqual: (a: string, b: string) => a === b,
}));

vi.mock('@/shared/utils/otp/generate-otp', () => ({
  default: vi.fn(() => '123456'),
}));

const hashPasswordMock = vi.mocked(hashPassword);

describe('SignupCommand', () => {
  let userRepository: UserRepositoryPort;
  let rbac: RbacPort;
  let mailer: MailerPort;
  let avatarUploader: AvatarUploaderPort;
  let command: SignupCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    hashPasswordMock.mockResolvedValue('hashed');

    userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(buildUserEntity({ id: 'new-user' })),
      update: vi.fn(),
      setActive: vi.fn(),
    };

    rbac = {
      getUserAuthContext: vi.fn(),
      assignDefaultRole: vi.fn().mockResolvedValue(undefined),
    };

    mailer = { queue: vi.fn().mockResolvedValue(undefined) };
    avatarUploader = { upload: vi.fn().mockResolvedValue(null) };

    command = new SignupCommand({ userRepository, rbac, mailer, avatarUploader });
  });

  it('rejects when email already exists', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUserEntity());

    await expect(command.execute(buildSignupPayload())).rejects.toBeInstanceOf(
      EmailAlreadyExistsError,
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('creates user, assigns default role, and queues OTP mail', async () => {
    const payload = buildSignupPayload({ email: 'new@example.com' });
    const result = await command.execute(payload);

    expect(userRepository.create).toHaveBeenCalled();
    expect(rbac.assignDefaultRole).toHaveBeenCalledWith('new-user');
    expect(mailer.queue).toHaveBeenCalled();
    expect(result).toMatchObject({
      email: 'new@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
  });
});
