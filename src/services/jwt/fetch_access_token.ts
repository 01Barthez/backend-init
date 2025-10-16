import type { Request, Response } from 'express';

import { response } from '@/utils/responses/helpers';

import log from '../logging/logger';

const fetchAccessToken = (req: Request, res: Response): string => {
  // Recuperation de l'access token dans le header authorisatioin
  const authHeader = req.headers['authorization'];
  //* log.debug(`authHeader extracted: ${authHeader}`);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log.warn('Authorization header is malformed !');
    response.unauthorized(req, res, 'Malformed token.');

    return '';
  }

  const accessToken = authHeader.replace('Bearer Bearer', 'Bearer').split(' ')[1] || ''; // Because i don't know qhy but we often have two Bearer world...
  //* log.debug(`Token extracted: ${accessToken}`);
  return accessToken;
};

export default fetchAccessToken;
