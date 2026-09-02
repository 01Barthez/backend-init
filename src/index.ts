/**
 * Process entrypoint — binds the HTTP server and handles graceful shutdown.
 */
import chalk from 'chalk';

import { config } from '@/app/config';
import log from '@/shared/infrastructure/logging/logger';
import { bottomBorder, displayStartupMessage, topBorder } from '@/shared/utils/startup-message';

import app from './server';

const server = app
  .listen(config.app.port, () => {
    console.clear();
    displayStartupMessage();
    log.info(
      chalk.hex('#27ae60')('│ ') +
        chalk.hex('##ff00ff').bold('Server running at: ') +
        chalk.hex('##40ff00').bold.underline(`http://localhost:${config.app.port}`) +
        chalk.hex('#27ae60')(''),
    );
    log.info(
      chalk.hex('#27ae60')('│ ') +
        chalk.hex('##ff00ff').bold('Swagger documentation at: ') +
        chalk.hex('##40ff00').bold.underline(`http://localhost:${config.app.port}/api-docs`) +
        chalk.hex('#27ae60')(''),
    );

    console.log('\n');
    console.log(topBorder);
    console.log(bottomBorder);
    console.log('\n');
  })
  .on('error', (err) => {
    log.error(`Error while starting the server: ${err.message}`);
    throw new Error(`Error while starting the server: ${err.message}`);
  });

process.on('SIGTERM', () => {
  log.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  log.info('SIGINT received. Shutting down gracefully');
  server.close(() => {
    log.info('Process terminated');
  });
});
