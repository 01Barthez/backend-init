import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginCommand } from '@/modules/auth/application/commands/login.command';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import type { TokenServicePort } from '@/modules/auth/application/services/token.service.port';
import type { UserEntity } from '@/modules/auth/domain/entities/user.entity';
import { InvalidCredentialsError } from '@/modules/auth/domain/errors/auth.errors';
import type { UserRepositoryPort } from '@/modules/auth/domain/repositories/user.repository';
import { comparePassword } from '@/shared/utils/crypto';

vi.mock('@/shared/utils/crypto', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

const comparePasswordMock = vi.mocked(comparePassword);

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Doe',
  passwordHash: 'hashed-password',
  phone: '+33600000000',
  avatarUrl: null,
  isVerified: true,
  isActive: true,
  isDeleted: false,
  ...overrides,
});

describe('LoginCommand', () => {
  let userRepository: UserRepositoryPort;
  let tokenService: TokenServicePort;
  let rbac: RbacPort;
  let mailer: MailerPort;
  let command: LoginCommand;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setActive: vi.fn().mockResolvedValue(undefined),
    };

    tokenService = {
      issueTokenPair: vi.fn().mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessJti: 'access-jti',
        refreshJti: 'refresh-jti',
        familyId: 'family-1',
      }),
      persistRefreshToken: vi.fn().mockResolvedValue(undefined),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
      generatePasswordResetToken: vi.fn(),
      verifyPasswordResetToken: vi.fn(),
      rotateRefreshToken: vi.fn(),
      getRefreshCookieName: vi.fn().mockReturnValue('refresh_token'),
    };

    rbac = {
      getUserAuthContext: vi.fn().mockResolvedValue({
        permissions: ['blog:create'],
        roles: ['USER'],
      }),
      assignDefaultRole: vi.fn().mockResolvedValue(undefined),
    };

    mailer = {
      queue: vi.fn().mockResolvedValue(undefined),
    };

    command = new LoginCommand({ userRepository, tokenService, rbac, mailer });
  });

  it('throws InvalidCredentialsError when user is not found', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      command.execute({ email: 'missing@example.com', password: 'Password1!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(comparePasswordMock).not.toHaveBeenCalled();
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when password is invalid', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser());
    comparePasswordMock.mockResolvedValue(false);

    await expect(
      command.execute({ email: 'alice@example.com', password: 'WrongPass1!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it('returns tokens on successful login', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser());
    comparePasswordMock.mockResolvedValue(true);

    const result = await command.execute({
      email: 'alice@example.com',
      password: 'Password1!',
    });

    expect(result).toMatchObject({
      id: 'user-1',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Doe',
      roles: ['USER'],
      permissions: ['blog:create'],
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(tokenService.persistRefreshToken).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
      'refresh-jti',
      'family-1',
    );
    expect(userRepository.setActive).toHaveBeenCalledWith('user-1', true);
    expect(mailer.queue).toHaveBeenCalled();
  });
});
