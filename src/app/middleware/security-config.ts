/**
 * Security-related Express configuration: CSP, rate limits, Morgan stream.
 */
import rateLimit from 'express-rate-limit';

import { config } from '@/app/config';
import { LIMIT_REQUEST } from '@/shared/constants/rate-limit.constants';
import log from '@/shared/infrastructure/logging/logger';

export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-<randomNonce>'", 'https://apis.google.com'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'https://*.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'https://api.example.com'],
    mediaSrc: ["'self'"],
    workerSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    frameSrc: ["'none'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: config.app.isProduction ? [] : null,
    blockAllMixedContent: [],
    requireTrustedTypesFor: ["'script'"],
    sandbox: ['allow-scripts', 'allow-same-origin'],
    reportUri: config.security.cspReportUri,
  },
  reportOnly: !config.app.isProduction,
};

export const rateLimiting = rateLimit({
  max: config.security.rateLimit.globalMax,
  windowMs: config.security.rateLimit.globalWindowMs,
  message: LIMIT_REQUEST.GLOBAL_ROUTE,
});

export const rateLimitingSubRoute = rateLimit({
  max: config.security.rateLimit.uniqueMax,
  windowMs: config.security.rateLimit.uniqueWindowMs,
  message: LIMIT_REQUEST.SUB_ROUTE,
});

export const morganFormat = ':method :url  :status :response-time ms';
export const morganOptions = {
  stream: {
    write: (message: string) => log.http(message.trim()),
  },
};
