import log from '@/shared/infrastructure/logging/logger';

export interface Logger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

function toWinstonArgs(args: any[]): [string, object?] {
  const [message, meta] = args;
  const text = typeof message === 'string' ? message : String(message);

  if (meta === undefined) {
    return [text];
  }

  if (typeof meta === 'object' && meta !== null && !Array.isArray(meta)) {
    return [text, meta as object];
  }

  return [text, { detail: meta }];
}

/** Default uploader logger — delegates to the shared Winston logger. */
export function defaultLogger(): Logger {
  return {
    info: (...args: any[]) => {
      const [message, meta] = toWinstonArgs(args);
      if (meta) log.info(message, meta);
      else log.info(message);
    },
    warn: (...args: any[]) => {
      const [message, meta] = toWinstonArgs(args);
      if (meta) log.warn(message, meta);
      else log.warn(message);
    },
    error: (...args: any[]) => {
      const [message, meta] = toWinstonArgs(args);
      if (meta) log.error(message, meta);
      else log.error(message);
    },
  };
}
