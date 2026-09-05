/**
 * Builds the shared locals injected into every EJS mail template.
 * Callers only pass template-specific fields (otp, name, resetLink, …).
 */
import { config, envs } from '@/app/config';
import {
  MAIL_SOCIAL_IDS,
  MAIL_SOCIAL_LABELS,
  type MailBrandColors,
  type MailSocialLink,
} from '@/shared/constants/mail-brand.constants';

export type MailHeaderTone = 'brand' | 'success' | 'warning' | 'danger';

export type MailBrandLocals = {
  colors: MailBrandColors;
  logoUrl: string;
  tagline: string;
  company: string;
  address: string;
  phone: string;
  websiteLabel: string;
  privacyUrl: string;
  termsUrl: string;
  helpUrl: string;
  socials: MailSocialLink[];
  supportEmail: string;
  clientUrl: string;
  appName: string;
  year: number;
  headerGradient: (tone?: MailHeaderTone) => { from: string; to: string; soft: string };
};

export function buildMailBrandLocals(
  data: Record<string, unknown> = {},
): MailBrandLocals & Record<string, unknown> {
  const brand = config.mail.brand;
  const colors = brand.colors;

  const socials: MailSocialLink[] = [];
  for (const id of MAIL_SOCIAL_IDS) {
    const url = brand.social[id];
    if (!url) continue;
    socials.push({ id, label: MAIL_SOCIAL_LABELS[id], url });
  }

  const supportEmail =
    (data.supportEmail as string | undefined)?.trim() ||
    config.mail.supportEmail ||
    envs.USER_EMAIL ||
    '';

  const clientUrl = (data.clientUrl as string | undefined)?.trim() || envs.CLIENT_URL || '';

  const headerGradient = (tone: MailHeaderTone = 'brand') => {
    switch (tone) {
      case 'success':
        return { from: colors.success, to: colors.successDark, soft: colors.successSoft };
      case 'warning':
        return { from: colors.warning, to: colors.warningDark, soft: colors.warningSoft };
      case 'danger':
        return { from: colors.danger, to: colors.dangerDark, soft: colors.dangerSoft };
      default:
        return { from: colors.primary, to: colors.primaryDark, soft: colors.primarySoft };
    }
  };

  return {
    ...data,
    appName: envs.APP_NAME,
    year: new Date().getFullYear(),
    clientUrl,
    supportEmail,
    colors,
    logoUrl: brand.logoUrl,
    tagline: brand.tagline,
    company: brand.company,
    address: brand.address,
    phone: brand.phone,
    websiteLabel: brand.websiteLabel || 'Visit website',
    privacyUrl: brand.privacyUrl,
    termsUrl: brand.termsUrl,
    helpUrl: brand.helpUrl,
    socials,
    headerGradient,
  };
}
