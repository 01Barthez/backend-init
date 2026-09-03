/**
 * Security-related Express configuration: CSP (API-safe) and rate limits.
 * Rate-limit store is Redis in non-test environments so replicas share a budget.
 */
import type { Request, Response } from 'express';
import rateLimit, { type Options, type Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { config } from '@/app/config';
import { LIMIT_REQUEST } from '@/shared/constants/rate-limit.constants';
import redisClient from '@/shared/infrastructure/cache/clients/redis-client';

const PROBE_PATHS = new Set([
  '/health',
  '/health/live',
  '/health/ready',
  '/metrics',
  '/csrf-token',
]);

const skipProbes = (req: Request): boolean => {
  const path = req.path || req.originalUrl.split('?')[0];
  return PROBE_PATHS.has(path);
};

/** API CSP: deny everything by default. HTML UIs (Swagger) bypass this path. */
export const cspConfig = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    reportUri: config.security.cspReportUri,
  },
};

const redisStore = (): Store | undefined => {
  if (config.app.isTest) {
    return undefined;
  }

  return new RedisStore({
    // ioredis: send raw Redis commands for the sliding window.
    sendCommand: ((...args: string[]) => redisClient.call(args[0], ...args.slice(1))) as never,
    prefix: 'rl:',
  }) as Store;
};

const common: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipProbes,
  store: redisStore(),
};

export const rateLimiting = rateLimit({
  ...common,
  max: config.security.rateLimit.globalMax,
  windowMs: config.security.rateLimit.globalWindowMs,
  message: LIMIT_REQUEST.GLOBAL_ROUTE,
});

export const rateLimitingSubRoute = rateLimit({
  ...common,
  max: config.security.rateLimit.uniqueMax,
  windowMs: config.security.rateLimit.uniqueWindowMs,
  message: LIMIT_REQUEST.SUB_ROUTE,
});

/** Credential-stuffing / OTP brute-force bucket (login, forgot, OTP, reset). */
export const rateLimitingAuth = rateLimit({
  ...common,
  max: config.security.rateLimit.authMax,
  windowMs: config.security.rateLimit.authWindowMs,
  message: LIMIT_REQUEST.AUTH_ROUTE,
  skipSuccessfulRequests: true,
});

export const isProbePath = skipProbes;

export const sendRateLimitJson = (_req: Request, res: Response, message: string): void => {
  res.status(429).json({ success: false, message, code: 'RATE_LIMITED' });
};
