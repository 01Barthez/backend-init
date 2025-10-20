/**
 * LinkedIn OAuth Service
 * Handles LinkedIn OAuth2.0 authentication (OpenID Connect)
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface LinkedInUserInfo {
  sub: string; // User ID
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  picture: string;
  locale: string;
}

export class LinkedInOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.LINKEDIN_CLIENT_ID,
      clientSecret: envs.LINKEDIN_CLIENT_SECRET,
      redirectUri: envs.LINKEDIN_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.LINKEDIN.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.LINKEDIN.TOKEN,
      userInfoUrl: OAUTH_URLS.LINKEDIN.USER_INFO,
      scope: OAUTH_SCOPES.LINKEDIN,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.get<LinkedInUserInfo>(this.config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = response.data;

      return {
        provider: OAuthProvider.LINKEDIN,
        provider_user_id: userData.sub,
        email: userData.email,
        email_verified: userData.email_verified,
        first_name: userData.given_name,
        last_name: userData.family_name,
        full_name: userData.name,
        avatar_url: userData.picture,
        locale: userData.locale,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch LinkedIn user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from LinkedIn');
    }
  }
}
