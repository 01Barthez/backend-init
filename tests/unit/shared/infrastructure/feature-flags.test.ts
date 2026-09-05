import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const envsState = {
  FLAGSMITH_API_KEY: '',
  FLAGSMITH_API_URL: '',
  FLAGSMITH_REFRESH_SECONDS: 60,
  FLAGSMITH_DEFAULTS: {
    enable_oauth: true,
    enable_backup: true,
    enable_maintenance_jobs: true,
  } as Record<string, boolean>,
  FLAGSMITH_OVERRIDES: {
    enable_oauth: false as boolean | undefined,
    enable_backup: undefined as boolean | undefined,
    enable_maintenance_jobs: undefined as boolean | undefined,
  },
};

vi.mock('@/app/config', () => ({
  envs: envsState,
}));

vi.mock('@/shared/infrastructure/logging/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('featureFlagService', () => {
  beforeEach(() => {
    envsState.FLAGSMITH_OVERRIDES.enable_oauth = false;
    envsState.FLAGSMITH_OVERRIDES.enable_backup = undefined;
  });

  afterEach(async () => {
    const mod = await import('@/shared/infrastructure/feature-flags/flagsmith');
    mod.featureFlagService._resetForTests();
  });

  it('honours FEATURE_* overrides over defaults', async () => {
    const { featureFlagService } = await import('@/shared/infrastructure/feature-flags/flagsmith');
    await featureFlagService.start();
    expect(await featureFlagService.isEnabled('enable_oauth', true)).toBe(false);
    expect(await featureFlagService.isEnabled('enable_backup', true)).toBe(true);
  });

  it('keeps remote OFF as false instead of rebounding to default true', async () => {
    envsState.FLAGSMITH_OVERRIDES.enable_oauth = undefined;
    const { featureFlagService } = await import('@/shared/infrastructure/feature-flags/flagsmith');
    featureFlagService._setRemoteForTests({ enable_oauth: false });
    expect(await featureFlagService.isEnabled('enable_oauth', true)).toBe(false);
  });

  it('falls back to defaults when flag is absent remotely', async () => {
    envsState.FLAGSMITH_OVERRIDES.enable_oauth = undefined;
    const { featureFlagService } = await import('@/shared/infrastructure/feature-flags/flagsmith');
    featureFlagService._setRemoteForTests({});
    expect(await featureFlagService.isEnabled('enable_oauth', false)).toBe(true);
  });
});
