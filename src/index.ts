import app from "./server";
import { envs } from "@config/env/env";
import log from "@services/logging/logger";


// Start server
const server = app.listen(envs.PORT, () => {
  log.info(`Server running at http://localhost:${envs.PORT}`);
})
  // Handle server errors
  .on('error', (err) => {
    log.error(`Error while starting the server: ${err.message}`);
    process.exit(1);
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
  }
  ).on('SIGINT', () => {
    log.info('SIGINT received. Shutting down gracefully');
    server.close(() => {
      log.info('Process terminated');
    })
  });