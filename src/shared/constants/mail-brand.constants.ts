/**
 * Default transactional-mail brand kit.
 *
 * Override via env (`MAIL_BRAND_*`, `MAIL_SOCIAL_*`, `MAIL_FOOTER_*`) —
 * leave a value empty to hide that element in templates.
 * Templates never hardcode colors or social URLs.
 */

export type MailBrandColors = {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  success: string;
  successDark: string;
  successSoft: string;
  warning: string;
  warningDark: string;
  warningSoft: string;
  danger: string;
  dangerDark: string;
  dangerSoft: string;
  canvas: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  footerBg: string;
  onPrimary: string;
};

export type MailSocialLink = {
  id: string;
  label: string;
  url: string;
};

/** Premium default palette (teal ink — change freely via env). */
export const MAIL_BRAND_COLORS_DEFAULT: MailBrandColors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#CCFBF1',
  accent: '#F59E0B',
  success: '#059669',
  successDark: '#047857',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningDark: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerSoft: '#FEE2E2',
  canvas: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  footerBg: '#F8FAFC',
  onPrimary: '#FFFFFF',
};

export const MAIL_SOCIAL_IDS = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'youtube',
  'github',
  'tiktok',
] as const;

export type MailSocialId = (typeof MAIL_SOCIAL_IDS)[number];

export const MAIL_SOCIAL_LABELS: Record<MailSocialId, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X',
  youtube: 'YouTube',
  github: 'GitHub',
  tiktok: 'TikTok',
};
