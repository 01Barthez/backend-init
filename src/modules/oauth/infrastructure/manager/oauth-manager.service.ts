/**
 * OAuth Manager Service
 * Central service to manage all OAuth providers
 */
import { OAUTH_ERRORS, OAUTH_STATE_TTL } from '@/shared/constants/oauth.constants';
import prisma from '@/shared/infrastructure/database/prisma.client';
import log from '@/shared/infrastructure/logging/logger';
import { randomHex } from '@/shared/utils/crypto';

import type {
  IOAuthAccountData,
  IOAuthService,
  IOAuthState,
  IOAuthTokenResponse,
  IOAuthUserProfile,
} from '../../domain/types/oauth.types';
import { OAuthProvider } from '../../domain/types/oauth.types';
import { FacebookOAuthService } from '../providers/facebook-oauth.service';
import { GitHubOAuthService } from '../providers/github-oauth.service';
import { GoogleOAuthService } from '../providers/google-oauth.service';
import { InstagramOAuthService } from '../providers/instagram-oauth.service';
import { LinkedInOAuthService } from '../providers/linkedin-oauth.service';
import { TelegramOAuthService } from '../providers/telegram-oauth.service';
import { TwitterOAuthService } from '../providers/twitter-oauth.service';

export class OAuthManager {
  private providers: Map<OAuthProvider, IOAuthService>;
  private telegramService: TelegramOAuthService;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
    this.telegramService = new TelegramOAuthService();
  }

  private initializeProviders(): void {
    try {
      this.providers.set(OAuthProvider.GOOGLE, new GoogleOAuthService());
      this.providers.set(OAuthProvider.GITHUB, new GitHubOAuthService());
      this.providers.set(OAuthProvider.FACEBOOK, new FacebookOAuthService());
      this.providers.set(OAuthProvider.LINKEDIN, new LinkedInOAuthService());
      this.providers.set(OAuthProvider.TWITTER, new TwitterOAuthService());
      this.providers.set(OAuthProvider.INSTAGRAM, new InstagramOAuthService());

      log.info('OAuth providers initialized successfully');
    } catch (error: any) {
      log.error('Failed to initialize OAuth providers', {
        error: error.message,
      });
    }
  }

  getProvider(provider: OAuthProvider): IOAuthService {
    const service = this.providers.get(provider);
    if (!service) {
      throw new Error(OAUTH_ERRORS.PROVIDER_NOT_CONFIGURED);
    }
    return service;
  }

  generateState(redirectUrl?: string): IOAuthState {
    const state: IOAuthState = {
      state: randomHex(32),
      redirectUrl,
      timestamp: Date.now(),
    };
    return state;
  }

  verifyState(stateData: IOAuthState): boolean {
    const age = Date.now() - stateData.timestamp;
    return age <= OAUTH_STATE_TTL;
  }

  getAuthorizationUrl(provider: OAuthProvider, state: string): string {
    const service = this.getProvider(provider);
    return service.getAuthorizationUrl(state);
  }

  async exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<IOAuthTokenResponse> {
    const service = this.getProvider(provider);
    return service.exchangeCodeForToken(code);
  }

  async getUserProfile(provider: OAuthProvider, accessToken: string): Promise<IOAuthUserProfile> {
    const service = this.getProvider(provider);
    return service.getUserProfile(accessToken);
  }

  async findOrCreateUser(
    profile: IOAuthUserProfile,
    tokenData: IOAuthTokenResponse,
  ): Promise<{ user: any; isNewUser: boolean }> {
    try {
      const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
          },
        },
        include: {
          user: true,
        },
      });

      if (existingOAuthAccount) {
        await this.updateOAuthAccount(existingOAuthAccount.id, tokenData);

        return {
          user: existingOAuthAccount.user,
          isNewUser: false,
        };
      }

      let user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        await this.createOAuthAccount(user.id, profile, tokenData);

        return {
          user,
          isNewUser: false,
        };
      }

      user = await prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          isVerified: profile.emailVerified || false,
          isActive: true,
          emailVerifiedAt: profile.emailVerified ? new Date() : null,
          oauthAccounts: {
            create: {
              provider: profile.provider,
              providerUserId: profile.providerUserId,
              providerEmail: profile.email,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              tokenType: tokenData.token_type,
              expiresAt: tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000)
                : null,
              scope: tokenData.scope,
              providerProfileData: profile.rawProfile,
            },
          },
        },
      });

      log.info('New user created via OAuth', {
        provider: profile.provider,
        email: profile.email,
      });

      return {
        user,
        isNewUser: true,
      };
    } catch (error: any) {
      log.error('Failed to find or create user from OAuth', {
        provider: profile.provider,
        error: error.message,
      });
      throw new Error(OAUTH_ERRORS.ACCOUNT_LINKING_FAILED);
    }
  }

  private async createOAuthAccount(
    userId: string,
    profile: IOAuthUserProfile,
    tokenData: IOAuthTokenResponse,
  ): Promise<void> {
    await prisma.oAuthAccount.create({
      data: {
        userId,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        providerEmail: profile.email,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        scope: tokenData.scope,
        providerProfileData: profile.rawProfile,
      },
    });

    log.info('OAuth account linked to existing user', {
      provider: profile.provider,
      userId,
    });
  }

  private async updateOAuthAccount(
    accountId: string,
    tokenData: IOAuthTokenResponse,
  ): Promise<void> {
    await prisma.oAuthAccount.update({
      where: { id: accountId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || undefined,
        tokenType: tokenData.token_type,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        scope: tokenData.scope,
      },
    });
  }

  async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    try {
      await prisma.oAuthAccount.delete({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });

      log.info('OAuth account unlinked', { userId, provider });
    } catch (error: any) {
      log.error('Failed to unlink OAuth account', {
        userId,
        provider,
        error: error.message,
      });
      throw new Error('Failed to unlink OAuth account');
    }
  }

  async getUserOAuthAccounts(userId: string): Promise<IOAuthAccountData[]> {
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerUserId: true,
        providerEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return accounts as any;
  }

  async refreshAccessToken(userId: string, provider: OAuthProvider): Promise<string> {
    try {
      const oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });

      if (!oauthAccount?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const service = this.getProvider(provider);
      const tokenData = await service.refreshAccessToken!(oauthAccount.refreshToken);

      await this.updateOAuthAccount(oauthAccount.id, tokenData);

      return tokenData.access_token;
    } catch (error: any) {
      log.error('Failed to refresh OAuth token', {
        userId,
        provider,
        error: error.message,
      });
      throw new Error('Failed to refresh access token');
    }
  }

  getTelegramService(): TelegramOAuthService {
    return this.telegramService;
  }
}

export const oauthManager = new OAuthManager();
