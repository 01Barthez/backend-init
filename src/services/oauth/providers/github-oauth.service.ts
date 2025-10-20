/**
 * GitHub OAuth Service
 * Handles GitHub OAuth2.0 authentication
 */
import { envs } from '@/config/env/env';
import { OAUTH_SCOPES, OAUTH_URLS } from '@/core/constant/oauth.constant';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

import { BaseOAuthService } from '../base-oauth.service';

interface GitHubUserInfo {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
  location: string | null;
  bio: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export class GitHubOAuthService extends BaseOAuthService {
  constructor() {
    super({
      clientId: envs.GITHUB_CLIENT_ID,
      clientSecret: envs.GITHUB_CLIENT_SECRET,
      redirectUri: envs.GITHUB_REDIRECT_URI,
      authorizationUrl: OAUTH_URLS.GITHUB.AUTHORIZATION,
      tokenUrl: OAUTH_URLS.GITHUB.TOKEN,
      userInfoUrl: OAUTH_URLS.GITHUB.USER_INFO,
      scope: OAUTH_SCOPES.GITHUB,
    });
  }

  async getUserProfile(accessToken: string): Promise<IOAuthUserProfile> {
    try {
      // Fetch user info
      const userResponse = await this.httpClient.get<GitHubUserInfo>(this.config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const userData = userResponse.data;
      let email = userData.email;

      // If email is not public, fetch from emails endpoint
      if (!email) {
        const emailsResponse = await this.httpClient.get<GitHubEmail[]>(
          OAUTH_URLS.GITHUB.USER_EMAILS,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

        const primaryEmail = emailsResponse.data.find((e) => e.primary && e.verified);
        email = primaryEmail?.email || emailsResponse.data[0]?.email || '';
      }

      const fullName = userData.name || userData.login;
      const nameParts = fullName.split(' ');

      return {
        provider: OAuthProvider.GITHUB,
        provider_user_id: userData.id.toString(),
        email,
        email_verified: true,
        first_name: nameParts[0] || userData.login,
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: fullName,
        avatar_url: userData.avatar_url,
        raw_profile: userData,
      };
    } catch (error: any) {
      log.error('Failed to fetch GitHub user profile', {
        error: error.message,
      });
      throw new Error('Failed to fetch user information from GitHub');
    }
  }
}
