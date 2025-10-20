/**
 * Base OAuth Service
 * Abstract class that provides common OAuth2.0 functionality
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';

import type {
  IOAuthProviderConfig,
  IOAuthService,
  IOAuthTokenResponse,
  IOAuthUserProfile,
} from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

export abstract class BaseOAuthService implements IOAuthService {
  protected config: IOAuthProviderConfig;
  protected httpClient: AxiosInstance;

  constructor(config: IOAuthProviderConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent',
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await this.httpClient.post<IOAuthTokenResponse>(
        this.config.tokenUrl,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      log.error('Token exchange failed', {
        provider: this.config,
        error: error.message,
      });
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Get user profile from OAuth provider
   * Must be implemented by each provider
   */
  abstract getUserProfile(accessToken: string): Promise<IOAuthUserProfile>;

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<IOAuthTokenResponse> {
    try {
      const response = await this.httpClient.post<IOAuthTokenResponse>(
        this.config.tokenUrl,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      log.error('Token refresh failed', {
        error: error.message,
      });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(_token: string): Promise<void> {
    // Override in specific providers if they support revocation
    log.warn('Token revocation not implemented for this provider');
  }
}
