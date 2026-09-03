import type { NextFunction, Request, Response } from 'express';

import { config } from '@/app/config';

const realm = `${config.app.name} admin`;

const expectedUser = config.security.adminBasic.user;
const expectedPassword = config.security.adminBasic.password || config.security.swagger.password;

/**
 * HTTP Basic gate for operator UIs (Swagger, Bull Board).
 * Production must set ADMIN_BASIC_PASSWORD to a non-default value.
 */
export const adminBasicAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    res.status(401).send('Authentication required');
    return;
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const separator = credentials.indexOf(':');
  const username = separator >= 0 ? credentials.slice(0, separator) : credentials;
  const password = separator >= 0 ? credentials.slice(separator + 1) : '';

  if (username === expectedUser && password === expectedPassword && password.length > 0) {
    next();
    return;
  }

  res.status(401).send('Invalid credentials');
};

export default adminBasicAuth;
