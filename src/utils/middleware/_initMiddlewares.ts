import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { envs } from '@/config/env/env';
import csurf from 'csurf';
import { morganFormat, morganOptions, rateLimiting } from './securityConfig';
import compression from 'compression';
import { errorLog, requestLog } from '@/middlewares/requestLogger';
import { requestTimeMiddleware } from '@/middlewares/responseTime';
import disableLogsInProduction from '@/middlewares/disableLog';
import errorHandler from '@/middlewares/errorHandler';
import { validationErrorHandler } from '@/middlewares/validationErrorHandler';
import notFoundHandler from '@middlewares/notFoundRoutes';
import setupRoutes from './routes-middleware';

/**
 * @file _initMiddlewares.ts
 * @description Initializes and configures all core middlewares for the Express application.
 * 
 * This function sets up a comprehensive middleware stack, including:
 * - Security enhancements (Helmet, HSTS, CSP, disabling 'x-powered-by', rate limiting, compression)
 * - Cookie parsing and CORS configuration
 * - Request body parsing (JSON and URL-encoded)
 * - Logging and request timing
 * - CSRF protection (must be placed after cookie parsing and before route handlers)
 * - Route setup and validation error handling
 * - Centralized error logging and handling
 * - Handling of 404 Not Found routes
 * 
 * The order of middleware registration is critical for security and correct application behavior.
 * 
 * @param app - The Express application instance to configure.
 */
const initMiddlewares = (app: Express): void => {
    // 1. Middleware de sécurité
    app.use(helmet());
    app.use(helmet.hsts({
        maxAge: envs.HSTS_MAX_AGE,
        includeSubDomains: true,
        preload: true,
    }));

    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'nonce'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
            blockAllMixedContent: [],
        },
        reportOnly: envs.NODE_ENV !== 'production',
    }));

    // 2. Middleware de base
    app.use(cookieParser());
    app.use(cors({
        origin: envs.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    }));

    // 3. Middleware de parsing
    app.use(express.json({ limit: '20kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // 4. Middleware de journalisation
    app.use(morgan(morganFormat, morganOptions));
    app.use(requestLog);
    app.use(requestTimeMiddleware);
    app.use(disableLogsInProduction);

    // 5. Middleware de sécurité
    app.disable('x-powered-by');
    app.use(compression());
    app.use(rateLimiting);

    // 6. Middleware CSRF (doit être après cookieParser et avant les routes)
    app.use(csurf({
        cookie: {
            key: envs.CSRF_COOKIE_NAME,
            secure: envs.COOKIE_SECURE as boolean,
            httpOnly: envs.COOKIE_HTTP_STATUS as boolean,
            sameSite: envs.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
            domain: envs.COOKIE_DOMAIN as string,
            path: '/',
            maxAge: 86400 // 24h
        },
        ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
    }));

    // 7. Configuration des routes
    setupRoutes(app);

    // 8. Middleware de validation des données
    app.use(validationErrorHandler);

    // 9. Gestion des erreurs (doit être après les routes et avant les autres gestionnaires d'erreurs)
    app.use(errorLog);
    app.use(errorHandler);

    // 10. Gestion des routes non trouvées (doit être le dernier middleware)
    app.use(notFoundHandler);
};

export default initMiddlewares;