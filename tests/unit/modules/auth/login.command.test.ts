import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginCommand } from '@/modules/auth/application/commands/login.command';
import type { MailerPort } from '@/modules/auth/application/services/mailer.port';
import type { RbacPort } from '@/modules/auth/application/services/rbac.port';
import type { TokenServicePort } from '@/modules/auth/application/services/token.service.port';
import type { UserEntity } from '@/modules/auth/domain/entities/user.entity';
import {
  AccountInactiveError,
  InvalidCredentialsError,
} from '@/modules/auth/domain/errors/auth.errors';
import type { UserRepositoryPort } from '@/modules/auth/domain/repositories/user.repository';
import { comparePassword } from '@/shared/utils/crypto';

vi.mock('@/shared/utils/crypto', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
  DUMMY_PASSWORD_HASH: 'dummy-hash',
  encryptSecret: vi.fn((v: string) => v),
  decryptSecret: vi.fn((v: string) => v),
}));

vi.mock('@/modules/auth/application/services/totp', () => ({
  decryptTotpSecret: vi.fn((v: string) => v),
  isValidTotpCode: vi.fn().mockReturnValue(true),
  createTotpSecret: vi.fn(),
  buildTotpUri: vi.fn(),
  encryptTotpSecret: vi.fn(),
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
  failedLoginAttempts: 0,
  lockedUntil: null,
  totpEnabled: false,
  totpSecret: null,
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
      update: vi.fn().mockResolvedValue(buildUser()),
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
      createPasswordResetToken: vi.fn(),
      consumePasswordResetToken: vi.fn(),
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

  it('throws InvalidCredentialsError when user is not found (dummy hash compare)', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    comparePasswordMock.mockResolvedValue(false);

    await expect(
      command.execute({ email: 'missing@example.com', password: 'Password1!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(comparePasswordMock).toHaveBeenCalled();
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when password is invalid', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser());
    comparePasswordMock.mockResolvedValue(false);

    await expect(
      command.execute({ email: 'alice@example.com', password: 'WrongPass1!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(userRepository.update).toHaveBeenCalled();
    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it('returns tokens on successful login with isActive true in the JWT', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser({ isActive: true }));
    comparePasswordMock.mockResolvedValue(true);

    const result = await command.execute({
      email: 'alice@example.com',
      password: 'Password1!',
    });

    expect(result).toMatchObject({
      id: 'user-1',
      email: 'alice@example.com',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ failedLoginAttempts: 0 }),
    );
    expect(tokenService.issueTokenPair).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
      expect.any(Array),
      expect.any(Array),
    );
    expect(mailer.queue).toHaveBeenCalled();
  });

  it('rejects inactive accounts without issuing tokens', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser({ isActive: false }));
    comparePasswordMock.mockResolvedValue(true);

    await expect(
      command.execute({ email: 'alice@example.com', password: 'Password1!' }),
    ).rejects.toBeInstanceOf(AccountInactiveError);

    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });

  it('requires a TOTP code when TOTP is enabled', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      buildUser({ totpEnabled: true, totpSecret: 'encrypted-secret' }),
    );
    comparePasswordMock.mockResolvedValue(true);

    await expect(
      command.execute({ email: 'alice@example.com', password: 'Password1!' }),
    ).rejects.toMatchObject({ code: 'TOTP_REQUIRED' });

    expect(tokenService.issueTokenPair).not.toHaveBeenCalled();
  });
});
