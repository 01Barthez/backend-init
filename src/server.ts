/**
 * Express application export for the HTTP process and tests.
 * Listening is handled by `src/index.ts` so importing this module is side-effect free
 * regarding ports (bootstrap still runs unless NODE_ENV=test).
 */
import createApp from '@/app/app';

const app = createApp();

export default app;
export { createApp };
