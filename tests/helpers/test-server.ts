import type { Express } from 'express';
import type { Server } from 'http';

import app from '@/server';

export interface TestServer {
  app: Express;
  server: Server;
  close: () => Promise<void>;
}

export const createTestServer = async (): Promise<TestServer> => {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        app,
        server,
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close((error) => (error ? rejectClose(error) : resolveClose()));
          }),
      });
    });
  });
};
