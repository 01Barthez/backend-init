/**
 * Optionally mute console.log/info/warn/debug in production.
 * Prefer structured logging via Winston; this only silences leftover console noise.
 */
/* eslint-disable no-console -- this middleware intentionally patches console methods */
import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';

const consoleMethods: (keyof Console)[] = ['log', 'info', 'warn', 'debug'];

const originalConsole: Partial<Record<keyof Console, Console[keyof Console]>> = {};

const disableLogsInProduction = (_req: Request, _res: Response, next: NextFunction) => {
  const shouldDisable = config.app.isProduction && config.app.disableConsoleLogs === true;

  if (shouldDisable) {
    consoleMethods.forEach((method) => {
      if (!originalConsole[method]) {
        originalConsole[method] = console[method];
      }
      // Mute selected console methods in production.
      (console as any)[method] = () => undefined;
    });
  }

  next();
};

export default disableLogsInProduction;
