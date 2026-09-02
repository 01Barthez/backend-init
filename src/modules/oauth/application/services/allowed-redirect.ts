/**
 * Restrict OAuth post-login redirects to CLIENT_URL (+ OAUTH_ALLOWED_ORIGINS).
 * Unknown / foreign origins fall back to the SPA origin — never honor an open redirect.
 */
export const resolveAllowedRedirect = (
  candidate: string | undefined,
  clientUrl: string,
  extraOriginsCsv = '',
): string => {
  const allowed = new Set<string>();

  const push = (value: string) => {
    try {
      allowed.add(new URL(value).origin);
    } catch {
      /* ignore malformed entries */
    }
  };

  push(clientUrl);
  extraOriginsCsv
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach(push);

  if (!candidate?.trim()) {
    return clientUrl;
  }

  try {
    const resolved = new URL(candidate, clientUrl);
    if (allowed.has(resolved.origin)) {
      return resolved.toString();
    }
  } catch {
    /* fall through */
  }

  return clientUrl;
};
