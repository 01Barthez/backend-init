/**
 * Facebook OAuth Service
 * Handles Facebook OAuth2.0 authentication
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  picture: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
  locale: string;
}

export class FacebookOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.FACEBOOK_CLIENT_ID,
      clientSecret: envs.FACEBOOK_CLIENT_SECRET,
      redirectUri: envs.FACEBOOK_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.FACEBOOK.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.FACEBOOK.TOKEN,
      userInfoUrl: OAUTH_URLS.FACEBOOK.USER_INFO,
      scope: OAUTH_SCOPES.FACEBOOK,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.get<FacebookUserInfo>(this.config.userInfoUrl, {
        params: {
          fields: 'id,email,name,first_name,last_name,picture.type(large),locale',
          access_token: accessToken,
        },
      });

      const userData = response.data;

      return {
        provider: OAuthProvider.FACEBOOK,
        provider_user_id: userData.id,
        email: userData.email,
        email_verified: true, // Facebook verifies emails
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: userData.name,
        avatar_url: userData.picture?.data?.url,
        locale: userData.locale,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Facebook user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Facebook');
    }
  }
}
