import client from 'prom-client';

/** Histogram of HTTP request duration (seconds). */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

/** Counter of HTTP requests by method, route template, and status. */
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
): void => {
  const labels = {
    method,
    route,
    status_code: String(statusCode),
  };

  httpRequestTotal.inc(labels);
  httpRequestDuration.observe(labels, durationMs / 1000);
};
