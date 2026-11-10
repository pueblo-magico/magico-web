const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export function normalizePortalUrl(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const isLocalDevelopment = LOCAL_HOSTNAMES.has(url.hostname);
    const hasSafeProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && isLocalDevelopment);

    if (!hasSafeProtocol || url.username || url.password || url.search || url.hash) {
      return null;
    }

    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function resolvePortalUrl(configuredUrl: string | undefined, fallbackUrl: string): string {
  const fallback = normalizePortalUrl(fallbackUrl);
  if (!fallback) {
    throw new Error('The canonical portal URL is invalid.');
  }

  return normalizePortalUrl(configuredUrl) ?? fallback;
}
