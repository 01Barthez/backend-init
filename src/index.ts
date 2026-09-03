/**
 * Process entrypoint — bootstrap, bind HTTP (unless PROCESS_ROLE=worker), handle shutdown.
 */
/* eslint-disable no-process-exit -- fatal startup and listen failures must stop the process */
import chalk from 'chalk';

import { bootstrapApplication, createApp } from '@/app/app';
import { config } from '@/app/config';
import {
  gracefulShutdown,
  registerProcessHandlers,
} from '@/shared/infrastructure/lifecycle/shutdown';
import log from '@/shared/infrastructure/logging/logger';
import { bottomBorder, displayStartupMessage, topBorder } from '@/shared/utils/startup-message';

registerProcessHandlers();

/** Mute stray console noise once at boot — not per request. */
if (config.app.isProduction && config.app.disableConsoleLogs) {
  const mutedMethods = ['log', 'info', 'warn', 'debug'] as const;
  for (const method of mutedMethods) {
    (console as any)[method] = () => undefined;
  }
}

const start = async (): Promise<void> => {
  await bootstrapApplication();

  if (config.app.processRole === 'worker') {
    log.info('Worker process running (no HTTP listen)', { processRole: 'worker' });
    const onSignal = (signal: string) => {
      void gracefulShutdown(null, signal);
    };
    process.on('SIGTERM', () => onSignal('SIGTERM'));
    process.on('SIGINT', () => onSignal('SIGINT'));
    return;
  }

  const app = createApp();

  const server = app.listen(config.app.port, () => {
    console.clear();
    displayStartupMessage();
    log.info(
      chalk.hex('#27ae60')('│ ') +
        chalk.hex('#ff00ff').bold('Server running at: ') +
        chalk.hex('#40ff00').bold.underline(`http://localhost:${config.app.port}`) +
        chalk.hex('#27ae60')(''),
    );
    if (config.security.swagger.enabled) {
      log.info(
        chalk.hex('#27ae60')('│ ') +
          chalk.hex('#ff00ff').bold('Swagger documentation at: ') +
          chalk.hex('#40ff00').bold.underline(`http://localhost:${config.app.port}/api-docs`) +
          chalk.hex('#27ae60')(''),
      );
    }

    console.log('\n');
    console.log(topBorder);
    console.log(bottomBorder);
    console.log('\n');
  });

  server.requestTimeout = config.app.requestTimeoutMs;
  server.headersTimeout = config.app.requestTimeoutMs + 5_000;

  server.on('error', (err) => {
    log.error(`Error while starting the server: ${err.message}`);
    process.exit(1);
  });

  const onSignal = (signal: string) => {
    void gracefulShutdown(server, signal);
  };

  process.on('SIGTERM', () => onSignal('SIGTERM'));
  process.on('SIGINT', () => onSignal('SIGINT'));
};

start().catch((error: unknown) => {
  log.error('Fatal startup error', {
    error: error instanceof Error ? error.stack : String(error),
  });
  process.exit(1);
});
