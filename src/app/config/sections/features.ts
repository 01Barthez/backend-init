/**
 * Feature flags and external secret management.
 * Flagsmith drives runtime toggles; Infisical is optional for secret injection.
 */
import { fromEnv } from '../env';

export const featuresConfig = {
  flagsmith: {
    apiKey: fromEnv.get('FLAGSMITH_API_KEY').default('').asString(),
    apiUrl: fromEnv.get('FLAGSMITH_API_URL').default('').asString(),
    /** Safe defaults when the remote service is unreachable. */
    defaults: {
      enable_oauth: true,
      enable_backup: true,
      enable_maintenance_jobs: true,
    } as Record<string, boolean>,
  },

  infisical: {
    clientId: fromEnv.get('INFISICAL_CLIENT_ID').default('').asString(),
    clientSecret: fromEnv.get('INFISICAL_CLIENT_SECRET').default('').asString(),
    projectId: fromEnv.get('INFISICAL_PROJECT_ID').default('').asString(),
    environment: fromEnv.get('INFISICAL_ENVIRONMENT').default('dev').asString(),
  },
} as const;

export type FeaturesConfig = typeof featuresConfig;
