import { envs } from "./config/env/env";
import app from "./server";
import log from "./services/logging/logger";


// Start server
app.listen(envs.PORT, () => {
  log.info(`Server running at http://localhost:${envs.PORT}`);
})
  .on('error', (err) => {
    log.error(`Error while starting the server: ${err.message}`);
    process.exit(1);
  });
