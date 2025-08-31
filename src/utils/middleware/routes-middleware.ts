import health from '@/router/healtcheck/health.router';
import items from '@/router/items/items.router';
import { Express } from 'express';
import { rateLimitingSubRoute } from './securityConfig';
import CSRF from '@/router/CSRF-token/csrf.router';
import CSP from '@/router/CSP/csp.router';
import { envs } from '@/config/env/env';


//? program routes
const setupRoutes = (app: Express): void => {
    // Content Security Policy route
    app.use(
        envs.CSP_REPORT_URI,
        rateLimitingSubRoute,
        CSP
    )

    // CSRF token route
    app.use(
        '/csrf-token',
        rateLimitingSubRoute,
        CSRF
    )

    // Items routes
    app.use(
        '/items',
        rateLimitingSubRoute,
        items
    );

    // Health check routes
    app.use(
        '/health',
        rateLimitingSubRoute,
        health
    );

}

export default setupRoutes