import { Router } from 'express';
import client, { collectDefaultMetrics } from 'prom-client';

const metricsRouter = Router();

collectDefaultMetrics({
  register: client.register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5],
});

// Endpoint to expose metrics
metricsRouter.get('/', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

export default metricsRouter;
