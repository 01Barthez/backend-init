/**
 * Feature flags and external secret management.
 * Flagsmith drives remote toggles; FEATURE_* env vars force local overrides.
 */
import { fromEnv } from '../env';

/** Parse optional tri-state bool from env (`''` = unset). */
function optionalEnvBool(name: string): boolean | undefined {
  const raw = fromEnv.get(name).default('').asString().trim().toLowerCase();
  if (!raw) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return undefined;
}

const defaultFlags = {
  enable_oauth: true,
  enable_backup: true,
  enable_maintenance_jobs: true,
} as const;

export type FeatureFlagName = keyof typeof defaultFlags;

export const featuresConfig = {
  flagsmith: {
    apiKey: fromEnv.get('FLAGSMITH_API_KEY').default('').asString(),
    /** Self-hosted example: http://127.0.0.1:8000/api/v1/ or http://flagsmith:8000/api/v1/ */
    apiUrl: fromEnv.get('FLAGSMITH_API_URL').default('').asString(),
    /** Poll interval when a remote key is configured (seconds). */
    refreshIntervalSeconds: fromEnv.get('FLAGSMITH_REFRESH_SECONDS').default('60').asIntPositive(),
    /** Safe defaults when Flagsmith is unreachable / unset. */
    defaults: { ...defaultFlags } as Record<string, boolean>,
    /**
     * Local kill-switches — win over Flagsmith when set.
     * Example: FEATURE_ENABLE_OAUTH=false
     */
    overrides: {
      enable_oauth: optionalEnvBool('FEATURE_ENABLE_OAUTH'),
      enable_backup: optionalEnvBool('FEATURE_ENABLE_BACKUP'),
      enable_maintenance_jobs: optionalEnvBool('FEATURE_ENABLE_MAINTENANCE_JOBS'),
    } as Record<string, boolean | undefined>,
  },

  infisical: {
    clientId: fromEnv.get('INFISICAL_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('INFISICAL_CLIENT_SECRET').default('').asString(),
    projectId: fromEnv.get('INFISICAL_PROJECT_ID').default('').asString(),
    environment: fromEnv.get('INFISICAL_ENVIRONMENT').default('dev').asString(),
  },
} as const;

export type FeaturesConfig = typeof featuresConfig;
