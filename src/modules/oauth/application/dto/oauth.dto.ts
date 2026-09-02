import type { OAuthProvider } from '../../domain/types/oauth.types';

export type AuthorizeInput = {
  provider: string;
  redirectUrl?: string;
};

export type AuthorizeResult = {
  authUrl: string;
  stateCookieValue: string;
  stateCookieMaxAgeMs: number;
};

export type CallbackInput = {
  provider: string;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
  stateCookie?: string;
};

export type CallbackResult = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profileUrl?: string | null;
  isNewUser: boolean;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  redirectUrl?: string;
};

export type UnlinkInput = {
  userId: string;
  provider: string;
};

export type ListAccountsInput = {
  userId: string;
};

export type LinkedAccountDto = {
  provider: OAuthProvider;
  providerEmail?: string;
  linkedAt?: Date;
};

export type TelegramAuthInput = {
  authData: Record<string, unknown> & { hash?: string };
};
