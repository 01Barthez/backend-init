/**
 * Twitter (X) OAuth Service
 * Handles Twitter OAuth2.0 authentication
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface TwitterUserInfo {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
  };
}

export class TwitterOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.TWITTER_CLIENT_ID,
      clientSecret: envs.TWITTER_CLIENT_SECRET,
      redirectUri: envs.TWITTER_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.TWITTER.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.TWITTER.TOKEN,
      userInfoUrl: OAUTH_URLS.TWITTER.USER_INFO,
      scope: OAUTH_SCOPES.TWITTER,
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state,
      code_challenge: 'challenge', // PKCE required for Twitter
      code_challenge_method: 'plain',
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      const response = await this.httpClient.get<TwitterUserInfo>(this.config.userInfoUrl, {
        params: {
          'user.fields': 'id,name,username,profile_image_url',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = response.data.data;
      const nameParts = userData.name.split(' ');

      return {
        provider: OAuthProvider.TWITTER,
        provider_user_id: userData.id,
        email: '', // Twitter doesn't provide email in v2 API by default
        email_verified: false,
        first_name: nameParts[0] || userData.username,
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: userData.name,
        avatar_url: userData.profile_image_url,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch Twitter user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from Twitter');
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.httpClient.post(
        OAUTH_URLS.TWITTER.REVOKE,
        {
          token,
          token_type_hint: 'access_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
        },
      );
      log.info('Twitter token revoked successfully');
    } catch (error: any) {
      log.error('Failed to revoke Twitter token', {
        error: error.message,
      });
    }
  }
}
