/**
 * Flagsmith feature-flag client with in-memory defaults fallback.
 * When the API key is missing or the SDK is unavailable, defaults from config apply.
 */
import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

type FeatureFlags = Record<string, boolean | string | number>;

let cachedFlags: FeatureFlags = { ...envs.FLAGSMITH_DEFAULTS };

const loadFlagsmith = async (): Promise<void> => {
  if (!envs.FLAGSMITH_API_KEY) return;

  try {
    const flagsmithModule = await import('flagsmith' as string);
    const Flagsmith = (flagsmithModule as { default?: { init: (opts: object) => unknown } })
      .default;
    if (!Flagsmith?.init) return;

    const client = Flagsmith.init({
      environmentKey: envs.FLAGSMITH_API_KEY,
      apiUrl: envs.FLAGSMITH_API_URL || undefined,
    }) as {
      getEnvironmentFlags: () => Promise<{
        isFeatureEnabled: (key: string) => boolean;
        getFeatureValue: (key: string) => unknown;
      }>;
    };

    const flags = await client.getEnvironmentFlags();
    for (const key of Object.keys(envs.FLAGSMITH_DEFAULTS)) {
      cachedFlags[key] = flags.isFeatureEnabled(key)
        ? ((flags.getFeatureValue(key) as boolean | string | number) ?? true)
        : envs.FLAGSMITH_DEFAULTS[key];
    }

    log.info('Flagsmith flags loaded');
  } catch (error) {
    log.warn('Flagsmith unavailable, using defaults', { error });
  }
};

export const featureFlagService = {
  async refresh(): Promise<void> {
    await loadFlagsmith();
  },

  async isEnabled(flag: string, fallback = false): Promise<boolean> {
    await loadFlagsmith();
    const value = cachedFlags[flag] ?? envs.FLAGSMITH_DEFAULTS[flag] ?? fallback;
    return Boolean(value);
  },

  async getValue<T extends boolean | string | number>(flag: string, fallback: T): Promise<T> {
    await loadFlagsmith();
    return (cachedFlags[flag] ?? envs.FLAGSMITH_DEFAULTS[flag] ?? fallback) as T;
  },
};

export default featureFlagService;
