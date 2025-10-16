import jwt from 'jsonwebtoken';

import { envs } from '@/config/env/env';
import { readFileSync } from '@/utils/fsUtils';

const userToken = {
  accessToken: (payload): string => {
    const signOption = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_ACCESS_EXPIRES_IN as string,
    };

    return jwt.sign(payload, readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '', signOption) as string;
  },

  verifyAccessToken: (token: string) => {
    try {
      return jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '');
    } catch (error) {
      throw new Error(`Failed to verify access token: ${error}`);
    }
  },

  refreshToken: (payload): string => {
    const signOption = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_REFRESH_EXPIRES_IN as string,
    };

    return jwt.sign(payload, readFileSync(envs.JWT_REFRESH_PRIVATE_KEY_PATH), signOption);
  },

  verifyRefreshToken: (refreshToken: string) => {
    try {
      return jwt.verify(refreshToken, readFileSync(envs.JWT_REFRESH_PUBLIC_KEY_PATH));
    } catch (error) {
      throw new Error(`Failed to verify refresh token: ${error}`);
    }
  },

  decodeToken: (token: string) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error}`);
    }
  },
};

export default userToken;
