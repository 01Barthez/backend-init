export interface Logger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export function defaultLogger(): Logger {
  return {
    info: (...args: any[]) => console.log('[uploader]', ...args),
    warn: (...args: any[]) => console.warn('[uploader]', ...args),
    error: (...args: any[]) => console.error('[uploader]', ...args),
  };
}
