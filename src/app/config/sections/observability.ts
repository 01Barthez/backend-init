/**
 * Logging and observability settings (Winston, Loki, log level).
 */
import { fromEnv } from '../env';

export const observabilityConfig = {
  logLevel: fromEnv.get('LOG_LEVEL').default('info').asString(),
  logToFile: fromEnv.get('LOG_TO_FILE').default('false').asBool(),
  lokiEnabled: fromEnv.get('LOKI_ENABLED').default('false').asBool(),
} as const;

export type ObservabilityConfig = typeof observabilityConfig;
