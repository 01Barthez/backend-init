import prisma from '@/config/prisma/prisma';

import log from '../logging/logger';
import userToken from './jwt.service';

const blackListToken = {
  addToBlacklist: async (token: string) => {
    try {
      const decodeToken = userToken.decodeToken(token) as any;
      if (!decodeToken) {
        log.error('Invalid or expired tokens');
        throw new Error('Invalid or expired tokens');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodeToken.exp && decodeToken.exp < currentTime) {
        log.warn('Token is already expired.');
        return false;
      }

      const tokenExpiredDate = decodeToken.exp ? new Date(decodeToken.exp * 1000) : new Date();
      log.debug('Creating blacklist entry');

      await prisma.blacklist.create({
        data: {
          token,
          expireAt: tokenExpiredDate,
        },
      });

      log.info('Token added to blacklist successfully');
      return true;
    } catch (error) {
      throw new Error(`Failed to blacklist user token: ${error}`);
    }
  },

  isBlacklistedToken: async (token: string): Promise<boolean> => {
    try {
      const isBlackListed = await prisma.blacklist.findFirst({
        where: {
          token,
          expireAt: {
            gt: new Date(),
          },
        },
      });
      log.info(`Is token blacklisted: ${!!isBlackListed}`);

      return !!isBlackListed;
    } catch (error) {
      throw new Error(`Failed to check if user token is blacklisted: ${error}`);
    }
  },

  removeExpiredTokens: async (): Promise<void | undefined> => {
    try {
      await prisma.blacklist.deleteMany({
        where: {
          expireAt: {
            lte: new Date(),
          },
        },
      });
      log.info('Expired tokens deleted successfully');
    } catch (error) {
      throw new Error(`Failed to delete expired tokens: ${error}`);
    }
  },
};

export default blackListToken;
