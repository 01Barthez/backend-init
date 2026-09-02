/**
 * Instagram OAuth Service
 * Handles Instagram Basic Display API OAuth2.0 authentication
 */
import { envs } from '@/app/config';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/shared/constants/oauth.constants';
import log from '@/shared/infrastructure/logging/logger';

import { type IOAuthUserProfile, OAuthProvider } from '../../domain/types/oauth.types';
import { BaseOAuthService } from '../base-oauth.service';

interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

export class InstagramOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.INSTAGRAM_CLIENT_ID,
      clientSecret: envs.INSTAGRAM_CLIENT_SECRET,
      redirectUri: envs.INSTAGRAM_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.INSTAGRAM.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.INSTAGRAM.TOKEN,
      userInfoUrl: OAUTH_URLS.INSTAGRAM.USER_INFO,
      scope: OAUTH_SCOPES.INSTAGRAM,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.get<InstagramUserInfo>(this.config.userInfoUrl, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken,
        },
      });

      const userData = response.data;

      return {
        provider: OAuthProvider.INSTAGRAM,
        providerUserId: userData.id,
        email: '',
        emailVerified: false,
        firstName: userData.username,
        lastName: '',
        fullName: userData.username,
        avatarUrl: undefined,
        rawProfile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Instagram user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Instagram');
    }
  }
}
