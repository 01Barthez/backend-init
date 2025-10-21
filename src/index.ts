import { envs } from '@config/env/env';
import log from '@services/logging/logger';
import chalk from 'chalk';

import app from './server';
import { scheduler } from './services/scheduler';
import { bottomBorder, displayStartupMessage, topBorder } from './utils/startupMessage';

/**
 * *************************************************************************************************************************************
 **/
// Start server
const server = app
  .listen(envs.PORT, () => {
    console.clear();
    (displayStartupMessage(),
      log.info(
        chalk.hex('#27ae60')('│ ') +
          chalk.hex('##ff00ff').bold('🌐 Server running at 🌐  : ') +
          chalk.hex('##40ff00').bold.underline(`http://localhost:${envs.PORT}`) +
          chalk.hex('#27ae60')(''),
      ));
    log.info(
      chalk.hex('#27ae60')('│ ') +
        chalk.hex('##ff00ff').bold('📖 Swagger documentation at 📖  : ') +
        chalk.hex('##40ff00').bold.underline(`http://localhost:${envs.PORT}/api-docs`) +
        chalk.hex('#27ae60')(''),
    );

    console.log('\n');
    console.log(topBorder);
    console.log(bottomBorder);
    console.log('\n');
  })

  /**
   * *************************************************************************************************************************************
   **/
  // Handle server errors
  .on('error', (err) => {
    log.error(`Error while starting the server: ${err.message}`);
    throw new Error(`Error while starting the server: ${err.message}`);
  })
  // Handle unexpected errors
  .on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  })
  // Manage graceful shutdown
  .on('SIGTERM', () => {
    log.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      log.info('Process terminated');
    });
  })
  .on('SIGINT', () => {
    log.info('SIGINT received. Shutting down gracefully');
    scheduler.stopAll();
    server.close(() => {
      log.info('Process terminated');
    });
  });
/**
 * *************************************************************************************************************************************
 **/
