import type { Request, Response } from 'express';

import { response } from '@/utils/responses/helpers';

import log from '../logging/logger';

const fetchAccessToken = (req: Request, res: Response): string => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    log.warn('Authorization header is malformed');
    response.unauthorized(req, res, 'Malformed token.');

    return '';
  }

  const accessToken = authHeader.replace('Bearer Bearer', 'Bearer').split(' ')[1] || '';
  return accessToken;
};

export default fetchAccessToken;
