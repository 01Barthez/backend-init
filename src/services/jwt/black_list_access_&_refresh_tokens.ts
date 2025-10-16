import type { Request, Response } from 'express';

import log from '../logging/logger';
import blackListToken from './black_list';
import fetchAccessToken from './fetch_access_token';

const blackListAccessAndRefresToken = async (req: Request, res: Response) => {
  const accessToken = fetchAccessToken(req, res);
  await blackListToken.AddToblackList(accessToken);
  log.info('Access token is blacklited !');

  const refreshToken = req.cookies['refresh_key'] || '';
  await blackListToken.AddToblackList(refreshToken);
  log.info('refresh token is blacklited !');
};

export default blackListAccessAndRefresToken;
