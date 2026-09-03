/**
 * Logging and observability settings (Winston, Loki, optional tracing).
 * OpenTelemetry SDK is not a boot-time dependency — enable later via OTEL_ENABLED
 * and a process wrapper. We always parse W3C `traceparent` into request context.
 */
import { fromEnv } from '../env';

export const observabilityConfig = {
  logLevel: fromEnv.get('LOG_LEVEL').default('info').asString(),
  logToFile: fromEnv.get('LOG_TO_FILE').default('false').asBool(),
  lokiEnabled: fromEnv.get('LOKI_ENABLED').default('false').asBool(),
  lokiHost: fromEnv.get('LOKI_HOST').default('http://loki:3100').asString(),
  /**
   * Reserved flag: when true, an optional OTEL exporter may be started by ops.
   * The template does not initialize the Node SDK by default.
   */
  otelEnabled: fromEnv.get('OTEL_ENABLED').default('false').asBool(),
} as const;

export type ObservabilityConfig = typeof observabilityConfig;
