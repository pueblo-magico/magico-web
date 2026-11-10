export type WebsiteCookieKind = 'session' | 'transaction';

export function websiteCookieName(kind: WebsiteCookieKind, appBaseUrl: URL): string {
  const prefix = appBaseUrl.protocol === 'https:' ? '__Host-' : 'magico_web_dev_';
  return `${prefix}magico_web_${kind}`;
}

export function readWebsiteCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

export function serializeWebsiteCookie(input: {
  readonly appBaseUrl: URL;
  readonly maxAge: number;
  readonly name: string;
  readonly value: string;
}): string {
  const parts = [
    `${input.name}=${input.value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(input.maxAge))}`,
  ];
  if (input.appBaseUrl.protocol === 'https:') parts.push('Secure');
  return parts.join('; ');
}

export function clearWebsiteCookie(name: string, appBaseUrl: URL): string {
  return serializeWebsiteCookie({ appBaseUrl, maxAge: 0, name, value: '' });
}
