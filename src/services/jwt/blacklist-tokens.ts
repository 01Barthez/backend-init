import type { Request, Response } from 'express';

import log from '../logging/logger';
import blackListToken from './blacklist.service';
import fetchAccessToken from './fetch-access-token';

const blacklistTokens = async (req: Request, res: Response) => {
  const accessToken = fetchAccessToken(req, res);
  await blackListToken.addToBlacklist(accessToken);
  log.info('Access token blacklisted');

  const refreshToken = req.cookies['refresh_key'] || '';
  await blackListToken.addToBlacklist(refreshToken);
  log.info('Refresh token blacklisted');
};

export default blacklistTokens;
