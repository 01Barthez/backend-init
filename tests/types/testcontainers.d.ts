/**
 * Optional peer for live Mongo via Testcontainers.
 * Not installed by default — see tests/helpers/test-database.ts.
 */
declare module '@testcontainers/mongodb' {
  export class MongoDBContainer {
    constructor(image?: string);
    start(): Promise<{
      getConnectionString(): string;
      stop(): Promise<void>;
    }>;
  }
}
