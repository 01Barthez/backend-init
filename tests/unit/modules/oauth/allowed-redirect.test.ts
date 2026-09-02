import { describe, expect, it } from 'vitest';

import { resolveAllowedRedirect } from '@/modules/oauth/application/services/allowed-redirect';

describe('resolveAllowedRedirect', () => {
  const client = 'http://localhost:5173';

  it('defaults to CLIENT_URL', () => {
    expect(resolveAllowedRedirect(undefined, client)).toBe(client);
  });

  it('allows the SPA origin', () => {
    expect(resolveAllowedRedirect('http://localhost:5173/oauth/done', client)).toBe(
      'http://localhost:5173/oauth/done',
    );
  });

  it('rejects foreign origins', () => {
    expect(resolveAllowedRedirect('https://evil.example/steal', client)).toBe(client);
  });

  it('allows extra origins from the allowlist', () => {
    expect(
      resolveAllowedRedirect(
        'https://app.example.com/oauth/done',
        client,
        'https://app.example.com',
      ),
    ).toBe('https://app.example.com/oauth/done');
  });
});
