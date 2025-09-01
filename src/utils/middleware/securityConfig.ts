import rateLimit from 'express-rate-limit';

import { envs } from '@/config/env/env';
import { LIMIT_REQUEST } from '@/core/mock/global';
import log from '@/services/logging/logger';

export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],

    // Scripts
    scriptSrc: [
      "'self'",
      "'nonce-<randomNonce>'", // Recommandé à la place de unsafe-inline
      // Add third-party domains if necessary
      'https://apis.google.com', // exemple si tu utilises gapi
    ],

    // Styles
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],

    // Images
    imgSrc: [
      "'self'",
      'https://*.example.com', //! Replace with your domain
    ],

    // Fonts
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],

    // Connections (APIs, WebSockets, etc.)
    connectSrc: [
      "'self'",
      'https://api.example.com', //! Your API
    ],

    // Media and other worker sources
    mediaSrc: ["'self'"],
    workerSrc: ["'self'"],

    // Disallow potentially dangerous sources
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"], // Protection against clickjacking
    formAction: ["'self'"],
    baseUri: ["'self'"],
    frameSrc: ["'none'"],
    manifestSrc: ["'self'"],

    // Enforce HTTPS and other policies
    upgradeInsecureRequests: envs.NODE_ENV === 'production' ? [] : null,
    blockAllMixedContent: [],
    requireTrustedTypesFor: ["'script'"], // Active Trusted Types
    sandbox: ['allow-scripts', 'allow-same-origin'],

    // Reporting URI
    reportUri: '/security/csp-violation', // Endpoint for violation reports
  },
  reportOnly: envs.NODE_ENV !== 'production', // Report-only mode in development
};

export const rateLimiting = rateLimit({
  max: envs.MAX_GLOBAL_QUERY_NUMBER,
  windowMs: envs.MAX_GLOBAL_QUERY_WINDOW,
  message: LIMIT_REQUEST.GLOBAL_ROUTE,
});

export const rateLimitingSubRoute = rateLimit({
  max: envs.MAX_UNIQ_QUERY_NUMBER,
  windowMs: envs.MAX_UNIQ_QUERY_WINDOW,
  message: LIMIT_REQUEST.SUB_ROUTE,
});

// export const credentials = {
// 	key: keys.tls.privateKey,
// 	cert: keys.tls.certificate
// }

export const morganFormat = ':method :url  :status :response-time ms';
export const morganOptions = {
  stream: {
    write: (message: any) => log.http(message.trim()),
  },
};
