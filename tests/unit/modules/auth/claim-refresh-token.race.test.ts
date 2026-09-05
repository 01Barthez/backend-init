import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TokenRepositoryPort } from '@/modules/auth/domain/repositories/token.repository';

describe('claimRefreshTokenForRotation race', () => {
  let tokenRepository: TokenRepositoryPort;

  beforeEach(() => {
    tokenRepository = {
      claimRefreshTokenForRotation: vi.fn(),
    } as unknown as TokenRepositoryPort;
  });

  it('returns true only for the first concurrent claim', async () => {
    vi.mocked(tokenRepository.claimRefreshTokenForRotation)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const first = await tokenRepository.claimRefreshTokenForRotation('jti-1', 'next-a');
    const second = await tokenRepository.claimRefreshTokenForRotation('jti-1', 'next-b');

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(tokenRepository.claimRefreshTokenForRotation).toHaveBeenCalledTimes(2);
  });

  it('treats a lost race as reuse (caller must revoke family)', async () => {
    vi.mocked(tokenRepository.claimRefreshTokenForRotation).mockResolvedValue(false);

    const claimed = await tokenRepository.claimRefreshTokenForRotation('jti-reuse', 'next');
    expect(claimed).toBe(false);
  });
});
