/**
 * Persistence settings.
 * The application talks to the database exclusively through repositories;
 * only infrastructure should consume these values.
 */
import { fromEnv } from '../env';

export const databaseConfig = {
  /** Engine hint — currently MongoDB via Prisma. */
  type: fromEnv.get('DB_TYPE').default('mongodb').asString(),

  /** Full Prisma connection string (includes auth + replica set when applicable). */
  url: fromEnv.get('DATABASE_URL').required().asString(),

  mongo: {
    user: fromEnv.get('MONGO_USER').required().asString(),
    password: fromEnv.get('MONGO_PASSWORD').required().asString(),
    database: fromEnv.get('MONGO_DB').required().asString(),
    url: fromEnv.get('MONGO_URL').default('mongodb://admin:secret123@mongo:27017/').asString(),
  },

  /** Persist application logs into MongoDB (optional). */
  logToMongodb: fromEnv.get('LOG_TO_MONGODB').default('false').asBool(),
} as const;

export type DatabaseConfig = typeof databaseConfig;
