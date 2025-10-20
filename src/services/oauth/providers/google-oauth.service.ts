/**
 * Google OAuth Service
 * Handles Google OAuth2.0 authentication
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      redirectUri: envs.GOOGLE_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.GOOGLE.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.GOOGLE.TOKEN,
      userInfoUrl: OAUTH_URLS.GOOGLE.USER_INFO,
      scope: OAUTH_SCOPES.GOOGLE,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.get<GoogleUserInfo>(this.config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = response.data;

      return {
        provider: OAuthProvider.GOOGLE,
        provider_user_id: userData.id,
        email: userData.email,
        email_verified: userData.verified_email,
        first_name: userData.given_name || '',
        last_name: userData.family_name || '',
        full_name: userData.name,
        avatar_url: userData.picture,
        locale: userData.locale,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Google user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Google');
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.httpClient.post(OAUTH_URLS.GOOGLE.REVOKE, null, {
        params: { token },
      });
      log.info('Google token revoked successfully');
    } catch (error: any) {
      log.error('Failed to revoke Google token', {
        error: error.message,
      });
    }
  }
}
