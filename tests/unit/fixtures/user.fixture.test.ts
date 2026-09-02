import { describe, expect, it } from 'vitest';

import { SYSTEM_ROLES } from '@/shared/constants/app.constants';

import { buildUserFixture } from '../../fixtures/user.fixture';

describe('User fixture', () => {
  it('builds a valid user payload with defaults', () => {
    const user = buildUserFixture();

    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('Test');
    expect(user.role).toBe(SYSTEM_ROLES.USER);
  });

  it('allows overrides', () => {
    const user = buildUserFixture({ email: 'custom@example.com', role: SYSTEM_ROLES.ADMIN });

    expect(user.email).toBe('custom@example.com');
    expect(user.role).toBe(SYSTEM_ROLES.ADMIN);
  });
});
