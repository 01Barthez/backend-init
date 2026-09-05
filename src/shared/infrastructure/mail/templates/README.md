/\*\*

- Short README for mail templates.
-
- Brand kit (colors, socials, footer) is configured via env —
- see `.env.example` (`MAIL_BRAND_*`, `MAIL_SOCIAL_*`, `MAIL_FOOTER_*`)
- and defaults in `src/shared/constants/mail-brand.constants.ts`.
-
- Layout:
- templates/\*.ejs → one file per transactional email
- templates/partials/ → shared shell, header, footer, CTA, styles
-
- Empty social / footer fields are omitted from the rendered HTML. \*/
