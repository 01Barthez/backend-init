/**
 * Telegram OAuth Service
 * Handles Telegram Login Widget authentication
 * Note: Telegram uses a different flow (widget-based) rather than standard OAuth2.0
 */
import crypto from 'crypto';

import { envs } from '@/config/env/env';
import { type IOAuthUserProfile, OAuthProvider } from '@/core/interface/oauth.interface';
import log from '@/services/logging/logger';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class TelegramOAuthService {
  private botToken: string;

  constructor() {
    this.botToken = envs.TELEGRAM_BOT_TOKEN;
  }

  /**
   * Verify Telegram authentication data
   * Telegram uses HMAC-SHA256 for verification
   */
  verifyTelegramAuth(authData: TelegramAuthData): boolean {
    const { hash, ...data } = authData;

    // Create data check string
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key as keyof typeof data]}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto.createHash('sha256').update(this.botToken).digest();

    // Calculate HMAC
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // Check if auth_date is not too old (e.g., 1 day)
    const authAge = Date.now() / 1000 - authData.auth_date;
    if (authAge > 86400) {
      log.warn('Telegram auth data is too old');
      return false;
    }

    return hmac === hash;
  }

  /**
   * Parse Telegram user data into normalized profile
   */
  getUserProfile(authData: TelegramAuthData): IOAuthUserProfile {
    return {
      provider: OAuthProvider.TELEGRAM,
      provider_user_id: authData.id.toString(),
      email: '', // Telegram doesn't provide email
      email_verified: false,
      first_name: authData.first_name,
      last_name: authData.last_name || '',
      full_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
      avatar_url: authData.photo_url,
      raw_profile: authData,
    };
  }

  /**
   * Generate Telegram login widget URL
   */
  getLoginWidgetUrl(redirectUrl: string): string {
    const botUsername = envs.TELEGRAM_BOT_USERNAME;
    return `https://oauth.telegram.org/auth?bot_id=${this.botToken.split(':')[0]}&origin=${redirectUrl}&return_to=${redirectUrl}`;
  }
}
