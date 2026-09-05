/**
 * Feature-flag client (Flagsmith Node SDK) with env overrides + defaults fallback.
 *
 * Resolution order (highest wins):
 * 1. FEATURE_* env override (ops kill-switch)
 * 2. Last successful Flagsmith snapshot (remote OFF is stored as false)
 * 3. Config defaults
 * 4. Caller fallback
 *
 * Flags are loaded at bootstrap and refreshed on an interval — not on every read.
 */
import { Flagsmith } from 'flagsmith-nodejs';

import { envs } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';

type FlagMap = Record<string, boolean>;

/** Remote snapshot — only keys that Flagsmith answered for. */
let remoteFlags: FlagMap = {};
let loadedOnce = false;
let loadInFlight: Promise<void> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let client: Flagsmith | null = null;

function resolveFlag(flag: string, fallback: boolean): boolean {
  const override = envs.FLAGSMITH_OVERRIDES[flag];
  if (override !== undefined) return override;
  if (Object.prototype.hasOwnProperty.call(remoteFlags, flag)) {
    return remoteFlags[flag];
  }
  if (Object.prototype.hasOwnProperty.call(envs.FLAGSMITH_DEFAULTS, flag)) {
    return envs.FLAGSMITH_DEFAULTS[flag];
  }
  return fallback;
}

function getClient(): Flagsmith | null {
  if (!envs.FLAGSMITH_API_KEY) return null;
  if (client) return client;

  const apiUrl = envs.FLAGSMITH_API_URL.trim();
  client = new Flagsmith({
    environmentKey: envs.FLAGSMITH_API_KEY,
    ...(apiUrl ? { apiUrl: apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/` } : {}),
    requestTimeoutSeconds: 5,
    retries: 2,
  });
  return client;
}

async function fetchRemoteFlags(): Promise<void> {
  const flagsmith = getClient();
  if (!flagsmith) {
    loadedOnce = true;
    return;
  }

  try {
    const flags = await flagsmith.getEnvironmentFlags();
    const next: FlagMap = {};

    // Persist remote state as-is (enabled:false stays false — never rebound to defaults).
    for (const entry of flags.allFlags()) {
      if (entry.featureName) {
        next[entry.featureName] = entry.enabled;
      }
    }

    remoteFlags = next;
    loadedOnce = true;
    log.info('Flagsmith flags refreshed', {
      flags: next,
      source: 'flagsmith',
    });
  } catch (error) {
    loadedOnce = true;
    log.warn('Flagsmith unavailable, using overrides/defaults', { error });
  }
}

async function ensureLoaded(): Promise<void> {
  if (loadedOnce) return;
  if (loadInFlight) {
    await loadInFlight;
    return;
  }
  loadInFlight = fetchRemoteFlags().finally(() => {
    loadInFlight = null;
  });
  await loadInFlight;
}

export const featureFlagService = {
  /**
   * Fetch remote flags and start periodic refresh when an API key is configured.
   * Call once during process bootstrap.
   */
  async start(): Promise<void> {
    await fetchRemoteFlags();

    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    if (!envs.FLAGSMITH_API_KEY) {
      log.info('Flagsmith API key unset — using FEATURE_* overrides and defaults only', {
        overrides: Object.fromEntries(
          Object.entries(envs.FLAGSMITH_OVERRIDES).filter(([, v]) => v !== undefined),
        ),
        defaults: envs.FLAGSMITH_DEFAULTS,
      });
      return;
    }

    const intervalMs = Math.max(15, envs.FLAGSMITH_REFRESH_SECONDS) * 1000;
    refreshTimer = setInterval(() => {
      void fetchRemoteFlags();
    }, intervalMs);
    // Do not keep the event loop alive solely for flag polling.
    if (typeof refreshTimer.unref === 'function') {
      refreshTimer.unref();
    }
  },

  /** Manual refresh (tests / admin tooling). */
  async refresh(): Promise<void> {
    await fetchRemoteFlags();
  },

  async isEnabled(flag: string, fallback = false): Promise<boolean> {
    await ensureLoaded();
    return resolveFlag(flag, fallback);
  },

  async getValue<T extends boolean | string | number>(flag: string, fallback: T): Promise<T> {
    await ensureLoaded();
    // Template only uses boolean kill-switches; values fall back unless remote enabled.
    const enabled = resolveFlag(flag, Boolean(fallback));
    if (!enabled) return fallback;
    return enabled as T;
  },

  /** Test helper — reset in-memory state. */
  _resetForTests(): void {
    remoteFlags = {};
    loadedOnce = false;
    loadInFlight = null;
    client = null;
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  },

  /** Test helper — inject a remote snapshot (simulates Flagsmith response). */
  _setRemoteForTests(flags: FlagMap): void {
    remoteFlags = { ...flags };
    loadedOnce = true;
  },
};

export default featureFlagService;
