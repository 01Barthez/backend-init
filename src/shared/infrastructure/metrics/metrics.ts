/**
 * Prometheus metrics endpoint (default Node.js process metrics + HTTP RED).
 * Not exposed through public Nginx. Direct access requires operator Basic auth
 * except in tests.
 */
import { Router } from 'express';
import client, { collectDefaultMetrics } from 'prom-client';

import { config } from '@/app/config';
import { adminBasicAuth } from '@/app/middleware/admin-basic-auth.middleware';
import '@/shared/infrastructure/metrics/http-metrics';

const metricsRouter = Router();

collectDefaultMetrics({
  register: client.register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5],
});

const guards = config.app.isTest ? [] : [adminBasicAuth];

metricsRouter.get('/', ...guards, async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export default metricsRouter;
