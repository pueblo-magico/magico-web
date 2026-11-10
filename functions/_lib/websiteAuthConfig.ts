export interface WebsiteAuthEnv {
  readonly MAGICO_AUTH_CLIENT_ID?: string;
  readonly MAGICO_AUTH_ISSUER?: string;
  readonly WEBSITE_BASE_URL?: string;
  readonly WEBSITE_SESSION_SECRET?: string;
}

export interface WebsiteAuthConfig {
  readonly appBaseUrl: URL;
  readonly clientId: string;
  readonly issuer: string;
  readonly sessionSecret: string;
}

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized || normalized.startsWith('<')) throw new Error(`missing_${name.toLowerCase()}`);
  return normalized;
}

function secureUrl(value: string, name: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`invalid_${name}`);
  }
  const isLocalHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if ((url.protocol !== 'https:' && !isLocalHttp) || url.username || url.password || url.search || url.hash) {
    throw new Error(`invalid_${name}`);
  }
  return url;
}

export function readWebsiteAuthConfig(env: WebsiteAuthEnv): WebsiteAuthConfig {
  const appBaseUrl = secureUrl(required(env.WEBSITE_BASE_URL, 'WEBSITE_BASE_URL'), 'website_base_url');
  if (appBaseUrl.pathname !== '/') throw new Error('invalid_website_base_url');
  const issuerUrl = secureUrl(required(env.MAGICO_AUTH_ISSUER, 'MAGICO_AUTH_ISSUER'), 'magico_auth_issuer');
  const sessionSecret = required(env.WEBSITE_SESSION_SECRET, 'WEBSITE_SESSION_SECRET');
  if (sessionSecret.length < 32) throw new Error('invalid_website_session_secret');
  return {
    appBaseUrl,
    clientId: required(env.MAGICO_AUTH_CLIENT_ID, 'MAGICO_AUTH_CLIENT_ID'),
    issuer: issuerUrl.toString().replace(/\/$/, ''),
    sessionSecret,
  };
}
