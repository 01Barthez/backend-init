/**
 * Outbound email (SMTP) + transactional brand kit.
 * Transport details stay here; templates and queuing live under shared/mail.
 */
import {
  MAIL_BRAND_COLORS_DEFAULT,
  type MailBrandColors,
} from '@/shared/constants/mail-brand.constants';

import { fromEnv } from '../env';

const color = (key: string, fallback: string): string =>
  fromEnv.get(key).default(fallback).asString().trim() || fallback;

const optional = (key: string): string => fromEnv.get(key).default('').asString().trim();

export const mailConfig = {
  host: fromEnv.get('SMTP_HOST').required().asString(),
  port: fromEnv.get('SMTP_PORT').required().asPortNumber(),
  user: fromEnv.get('SMTP_USER').required().asString(),
  pass: fromEnv.get('SMTP_PASS').required().asString(),

  /** Envelope "from" address. */
  fromAddress: fromEnv.get('USER_EMAIL').required().asEmailString(),

  /**
   * Display name shown in email clients.
   * Falls back to APP_NAME when empty.
   */
  fromName: fromEnv.get('MAIL_FROM_NAME').default('').asString(),

  /**
   * Support inbox shown in footers / CTAs.
   * Falls back to USER_EMAIL when empty.
   */
  supportEmail: optional('MAIL_SUPPORT_EMAIL'),

  brand: {
    logoUrl: optional('MAIL_LOGO_URL'),
    tagline: optional('MAIL_FOOTER_TAGLINE'),
    company: optional('MAIL_FOOTER_COMPANY'),
    address: optional('MAIL_FOOTER_ADDRESS'),
    phone: optional('MAIL_FOOTER_PHONE'),
    websiteLabel: optional('MAIL_FOOTER_WEBSITE_LABEL'),
    privacyUrl: optional('MAIL_PRIVACY_URL'),
    termsUrl: optional('MAIL_TERMS_URL'),
    helpUrl: optional('MAIL_HELP_URL'),
    colors: {
      primary: color('MAIL_BRAND_PRIMARY', MAIL_BRAND_COLORS_DEFAULT.primary),
      primaryDark: color('MAIL_BRAND_PRIMARY_DARK', MAIL_BRAND_COLORS_DEFAULT.primaryDark),
      primarySoft: color('MAIL_BRAND_PRIMARY_SOFT', MAIL_BRAND_COLORS_DEFAULT.primarySoft),
      accent: color('MAIL_BRAND_ACCENT', MAIL_BRAND_COLORS_DEFAULT.accent),
      success: color('MAIL_BRAND_SUCCESS', MAIL_BRAND_COLORS_DEFAULT.success),
      successDark: color('MAIL_BRAND_SUCCESS_DARK', MAIL_BRAND_COLORS_DEFAULT.successDark),
      successSoft: color('MAIL_BRAND_SUCCESS_SOFT', MAIL_BRAND_COLORS_DEFAULT.successSoft),
      warning: color('MAIL_BRAND_WARNING', MAIL_BRAND_COLORS_DEFAULT.warning),
      warningDark: color('MAIL_BRAND_WARNING_DARK', MAIL_BRAND_COLORS_DEFAULT.warningDark),
      warningSoft: color('MAIL_BRAND_WARNING_SOFT', MAIL_BRAND_COLORS_DEFAULT.warningSoft),
      danger: color('MAIL_BRAND_DANGER', MAIL_BRAND_COLORS_DEFAULT.danger),
      dangerDark: color('MAIL_BRAND_DANGER_DARK', MAIL_BRAND_COLORS_DEFAULT.dangerDark),
      dangerSoft: color('MAIL_BRAND_DANGER_SOFT', MAIL_BRAND_COLORS_DEFAULT.dangerSoft),
      canvas: color('MAIL_BRAND_CANVAS', MAIL_BRAND_COLORS_DEFAULT.canvas),
      card: color('MAIL_BRAND_CARD', MAIL_BRAND_COLORS_DEFAULT.card),
      text: color('MAIL_BRAND_TEXT', MAIL_BRAND_COLORS_DEFAULT.text),
      textMuted: color('MAIL_BRAND_TEXT_MUTED', MAIL_BRAND_COLORS_DEFAULT.textMuted),
      border: color('MAIL_BRAND_BORDER', MAIL_BRAND_COLORS_DEFAULT.border),
      footerBg: color('MAIL_BRAND_FOOTER_BG', MAIL_BRAND_COLORS_DEFAULT.footerBg),
      onPrimary: color('MAIL_BRAND_ON_PRIMARY', MAIL_BRAND_COLORS_DEFAULT.onPrimary),
    } satisfies MailBrandColors,
    social: {
      facebook: optional('MAIL_SOCIAL_FACEBOOK'),
      instagram: optional('MAIL_SOCIAL_INSTAGRAM'),
      linkedin: optional('MAIL_SOCIAL_LINKEDIN'),
      twitter: optional('MAIL_SOCIAL_TWITTER'),
      youtube: optional('MAIL_SOCIAL_YOUTUBE'),
      github: optional('MAIL_SOCIAL_GITHUB'),
      tiktok: optional('MAIL_SOCIAL_TIKTOK'),
    },
  },
} as const;

export type MailConfig = typeof mailConfig;
