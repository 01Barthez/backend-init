import prisma from '@/config/prisma/prisma';

import log from '../logging/logger';
import userToken from './functions-jwt';

const blackListToken = {
  AddToblackList: async (token: string) => {
    try {
      // Decoder le token pour recuperer sa date d'expiration
      const decodeToken = userToken.decodeToken(token) as any;
      if (!decodeToken) {
        log.error('Invalid or expired tokens');
        throw new Error('Invalid or expired tokens');
      }

      // Vérification de l'expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodeToken.exp && decodeToken.exp < currentTime) {
        log.warn('Token is already expired.');
        return false; // Ne pas ajouter un token déjà expiré
      }

      const tokenExpiredDate = decodeToken.exp ? new Date(decodeToken.exp * 1000) : new Date();
      log.debug(`creation du token`);

      await prisma.blacklist.create({
        data: {
          token: token,
          expire_at: tokenExpiredDate,
        },
      });

      log.info(`Token added to blacklist successfully`);
      return true;
    } catch (error) {
      throw new Error(`Failed to blackList user token: ${error}`);
    }
  },

  // Verifier si un token a expiré
  isBlackListToken: async (token: string): Promise<boolean> => {
    try {
      const isBlackListed = await prisma.blacklist.findFirst({
        where: {
          token: token,
          expire_at: {
            gt: new Date(),
          },
        },
      });
      log.info(`Est ce que le token st blaklisté ? : ${!!isBlackListed}`);

      return !!isBlackListed;
    } catch (error) {
      throw new Error(`Failed to check if user token is blackListed: ${error}`);
    }
  },

  // Retirer tous les tokens qui ont expiré
  removeExpiredToken: async (): Promise<void | undefined> => {
    try {
      await prisma.blacklist.deleteMany({
        where: {
          expire_at: {
            lte: new Date(),
          },
        },
      });
      log.info('expired token successfully deleted !');
    } catch (error) {
      throw new Error(`Failed to delete expired token: ${error}`);
    }
  },
};

export default blackListToken;
