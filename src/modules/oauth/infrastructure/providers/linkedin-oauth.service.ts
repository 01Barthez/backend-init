/**
 * LinkedIn OAuth Service
 * Handles LinkedIn OAuth2.0 authentication (OpenID Connect)
 */
import { envs } from '@/app/config';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/shared/constants/oauth.constants';
import log from '@/shared/infrastructure/logging/logger';

import { type IOAuthUserProfile, OAuthProvider } from '../../domain/types/oauth.types';
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
        providerUserId: userData.sub,
        email: userData.email,
        emailVerified: userData.email_verified,
        firstName: userData.given_name,
        lastName: userData.family_name,
        fullName: userData.name,
        avatarUrl: userData.picture,
        locale: userData.locale,
        rawProfile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch LinkedIn user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from LinkedIn');
    }
  }
}
