/**
 * Express application export for tests.
 * Listening and bootstrap live in `src/index.ts` so importing this module
 * does not bind a port or start workers.
 */
import createApp from '@/app/app';

const app = createApp();

export default app;
export { createApp };
