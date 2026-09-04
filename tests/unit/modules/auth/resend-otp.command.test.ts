import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResendOtpCommand } from '@/modules/auth/application/commands/resend-otp.command';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import { OtpResendCooldownError } from '@/modules/auth/domain/errors/auth.errors';
import type { UserRepositoryPort } from '@/modules/auth/domain/repositories/user.repository';

import { buildUserEntity } from '../../../factories/user.factory';

vi.mock('@/shared/utils/otp/generate-otp', () => ({
  default: vi.fn(() => '654321'),
}));

vi.mock('@/app/config', async () => {
  const actual = await vi.importActual<typeof import('@/app/config')>('@/app/config');
  return {
    ...actual,
    envs: {
      ...actual.envs,
      OTP_DELAY: 900_000,
      OTP_RESEND_COOLDOWN: 60_000,
    },
  };
});

describe('ResendOtpCommand', () => {
  let userRepository: UserRepositoryPort;
  let mailer: MailerPort;
  let command: ResendOtpCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as UserRepositoryPort;
    mailer = { queue: vi.fn().mockResolvedValue(undefined) } as unknown as MailerPort;
    command = new ResendOtpCommand({ userRepository, mailer });
  });

  it('returns silently for unknown or already-verified emails', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    await expect(command.execute({ email: 'nobody@example.com' })).resolves.toEqual({
      emailSent: true,
    });
    expect(mailer.queue).not.toHaveBeenCalled();

    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      buildUserEntity({ email: 'v@example.com', isVerified: true }),
    );
    await expect(command.execute({ email: 'v@example.com' })).resolves.toEqual({
      emailSent: true,
    });
    expect(mailer.queue).not.toHaveBeenCalled();
  });

  it('rejects resend inside the cooldown window', async () => {
    const now = Date.now();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      buildUserEntity({
        email: 'u@example.com',
        isVerified: false,
        otp: {
          code: 'hash',
          // Issued ~10s ago (expireAt = issuedAt + OTP_DELAY)
          expireAt: new Date(now - 10_000 + 900_000),
        },
      }),
    );

    await expect(command.execute({ email: 'u@example.com' })).rejects.toBeInstanceOf(
      OtpResendCooldownError,
    );
    expect(mailer.queue).not.toHaveBeenCalled();
  });

  it('sends a new OTP when cooldown has elapsed', async () => {
    const now = Date.now();
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      buildUserEntity({
        email: 'u@example.com',
        isVerified: false,
        otp: {
          code: 'hash',
          // Issued ~2 minutes ago
          expireAt: new Date(now - 120_000 + 900_000),
        },
      }),
    );

    await expect(command.execute({ email: 'u@example.com' })).resolves.toEqual({
      emailSent: true,
    });
    expect(userRepository.update).toHaveBeenCalled();
    expect(mailer.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@example.com',
        template: 'otp',
        data: expect.objectContaining({ otp: '654321' }),
      }),
    );
  });
});
