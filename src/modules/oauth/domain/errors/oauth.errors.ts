import { AppError } from '@/shared/domain/errors/app-error';

export class OAuthInvalidProviderError extends AppError {
  constructor(message = 'Invalid OAuth provider') {
    super(400, message, 'OAUTH_INVALID_PROVIDER');
    this.name = 'OAuthInvalidProviderError';
  }
}

export class OAuthInvalidStateError extends AppError {
  constructor(message = 'Invalid OAuth state parameter') {
    super(400, message, 'OAUTH_INVALID_STATE');
    this.name = 'OAuthInvalidStateError';
  }
}

export class OAuthMissingCodeError extends AppError {
  constructor(message = 'Authorization code not provided') {
    super(400, message, 'OAUTH_MISSING_CODE');
    this.name = 'OAuthMissingCodeError';
  }
}

export class OAuthLinkingFailedError extends AppError {
  constructor(message = 'Failed to link OAuth account') {
    super(500, message, 'OAUTH_LINKING_FAILED');
    this.name = 'OAuthLinkingFailedError';
  }
}

export class OAuthProviderNotConfiguredError extends AppError {
  constructor(message = 'OAuth provider is not configured') {
    super(503, message, 'OAUTH_PROVIDER_NOT_CONFIGURED');
    this.name = 'OAuthProviderNotConfiguredError';
  }
}
