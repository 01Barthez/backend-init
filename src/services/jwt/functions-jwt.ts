import jwt from 'jsonwebtoken';

import { envs } from '@/config/env/env';
import type { IusersJwt } from '@/core/interface/global';
import { readFileSync } from '@/utils/fsUtils';

const userToken = {
  accessToken: (payload: IusersJwt): string => {
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_ACCESS_EXPIRES_IN as any,
    };

    return jwt.sign(payload, readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '', signOption) as string;
  },

  verifyAccessToken: (token: string) => {
    try {
      return jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '') as IusersJwt;
    } catch (error) {
      throw new Error(`Failed to verify access token: ${error}`);
    }
  },

  refreshToken: (payload: IusersJwt): string => {
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: envs.JWT_REFRESH_EXPIRES_IN as any,
    };

    return jwt.sign(payload, readFileSync(envs.JWT_REFRESH_PRIVATE_KEY_PATH), signOption);
  },

  verifyRefreshToken: (refreshToken: string) => {
    try {
      return jwt.verify(refreshToken, readFileSync(envs.JWT_REFRESH_PUBLIC_KEY_PATH)) as IusersJwt;
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

  generatePasswordResetToken: (userId: string): string => {
    const payload = { userId, type: 'password_reset' };
    const signOption: jwt.SignOptions = {
      algorithm: envs.JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: '1h' as any, // Reset token expires in 1 hour
    };

    return jwt.sign(payload, readFileSync(envs.JWT_PRIVATE_KEY_PATH) || '', signOption) as string;
  },

  verifyPasswordResetToken: (token: string): { userId: string; type: string } => {
    try {
      const decoded = jwt.verify(token, readFileSync(envs.JWT_PUBLIC_KEY_PATH) || '') as any;
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error(`Failed to verify password reset token: ${error}`);
    }
  },
};

export default userToken;
