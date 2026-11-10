import { createRemoteJWKSet, jwtVerify } from 'jose';
import { clearWebsiteCookie, readWebsiteCookie, serializeWebsiteCookie, websiteCookieName } from './websiteAuthCookies.ts';
import { randomBase64Url, sealWebsiteValue, sha256Base64Url, unsealWebsiteValue } from './websiteAuthCrypto.ts';
import type { WebsiteAuthConfig } from './websiteAuthConfig.ts';

const transactionLifetimeSeconds = 10 * 60;
const maximumSessionLifetimeSeconds = 8 * 60 * 60;

interface OidcDiscovery {
  readonly authorizationEndpoint: string;
  readonly jwksUri: string;
  readonly tokenEndpoint: string;
  readonly userInfoEndpoint: string;
}

interface WebsiteAuthTransaction {
  readonly codeVerifier: string;
  readonly createdAt: number;
  readonly nonce: string;
  readonly state: string;
}

export interface WebsiteSession {
  readonly displayName: string;
  readonly email?: string;
  readonly expiresAt: number;
  readonly issuer: string;
  readonly pictureUrl?: string;
  readonly subject: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredHttpsEndpoint(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`invalid_${name}`);
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`invalid_${name}`);
  return url.toString();
}

export async function discoverWebsiteOidc(issuer: string): Promise<OidcDiscovery> {
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error('website_oidc_discovery_unavailable');
  const text = await response.text();
  if (text.length > 65_536) throw new Error('website_oidc_discovery_too_large');
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('invalid_website_oidc_discovery');
  }
  if (!isRecord(value) || value.issuer !== issuer) throw new Error('invalid_website_oidc_discovery');
  return {
    authorizationEndpoint: requiredHttpsEndpoint(value.authorization_endpoint, 'website_authorization_endpoint'),
    jwksUri: requiredHttpsEndpoint(value.jwks_uri, 'website_jwks_uri'),
    tokenEndpoint: requiredHttpsEndpoint(value.token_endpoint, 'website_token_endpoint'),
    userInfoEndpoint: requiredHttpsEndpoint(value.userinfo_endpoint, 'website_userinfo_endpoint'),
  };
}

export async function fetchWebsiteOidcUserInfo(input: {
  readonly accessToken: string;
  readonly endpoint: string;
  readonly expectedSubject: string;
}): Promise<Record<string, unknown>> {
  const response = await fetch(input.endpoint, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error('website_oidc_userinfo_unavailable');
  const text = await response.text();
  if (text.length > 32_768) throw new Error('website_oidc_userinfo_too_large');
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('invalid_website_oidc_userinfo');
  }
  if (!isRecord(value) || value.sub !== input.expectedSubject) {
    throw new Error('invalid_website_oidc_userinfo');
  }
  return value;
}

function trimmedClaim(value: unknown, maximumLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maximumLength ? trimmed : undefined;
}

function profileImageUrl(value: unknown): string | undefined {
  const candidate = trimmedClaim(value, 2_048);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function parseWebsiteOidcProfile(value: unknown): {
  readonly displayName: string;
  readonly email?: string;
  readonly pictureUrl?: string;
} {
  const claims = isRecord(value) ? value : {};
  const email = trimmedClaim(claims.email, 320);
  const fullName = trimmedClaim(claims.name, 160);
  const givenName = trimmedClaim(claims.given_name, 80);
  const familyName = trimmedClaim(claims.family_name, 80);
  const composedName = [givenName, familyName].filter((part): part is string => Boolean(part)).join(' ');
  const preferredUsername = trimmedClaim(claims.preferred_username, 160);
  const pictureUrl = profileImageUrl(claims.picture);
  return {
    displayName: fullName ?? (composedName || undefined) ?? preferredUsername ?? email ?? 'Tu cuenta',
    ...(email ? { email } : {}),
    ...(pictureUrl ? { pictureUrl } : {}),
  };
}

function parseTransaction(value: unknown): WebsiteAuthTransaction {
  if (!isRecord(value)
    || typeof value.codeVerifier !== 'string'
    || typeof value.createdAt !== 'number'
    || typeof value.nonce !== 'string'
    || typeof value.state !== 'string') {
    throw new Error('invalid_website_oidc_transaction');
  }
  return {
    codeVerifier: value.codeVerifier,
    createdAt: value.createdAt,
    nonce: value.nonce,
    state: value.state,
  };
}

function parseSession(value: unknown): WebsiteSession {
  if (!isRecord(value)
    || typeof value.displayName !== 'string'
    || typeof value.expiresAt !== 'number'
    || typeof value.issuer !== 'string'
    || typeof value.subject !== 'string'
    || (value.email !== undefined && typeof value.email !== 'string')
    || (value.pictureUrl !== undefined && typeof value.pictureUrl !== 'string')) {
    throw new Error('invalid_website_session');
  }
  const email = typeof value.email === 'string' && value.email ? value.email : undefined;
  const pictureUrl = profileImageUrl(value.pictureUrl);
  if (value.pictureUrl !== undefined && !pictureUrl) throw new Error('invalid_website_session');
  return {
    displayName: value.displayName,
    ...(email ? { email } : {}),
    expiresAt: value.expiresAt,
    issuer: value.issuer,
    ...(pictureUrl ? { pictureUrl } : {}),
    subject: value.subject,
  };
}

function redirect(location: string, cookies: readonly string[] = []): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store', Location: location });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { headers, status: 302 });
}

export async function beginWebsiteLogin(config: WebsiteAuthConfig, prompt?: 'select_account'): Promise<Response> {
  const discovery = await discoverWebsiteOidc(config.issuer);
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const codeVerifier = randomBase64Url(48);
  const transaction: WebsiteAuthTransaction = {
    codeVerifier,
    createdAt: Math.floor(Date.now() / 1_000),
    nonce,
    state,
  };
  const callbackUrl = new URL('/api/v1/auth/callback', config.appBaseUrl).toString();
  const authorizationUrl = new URL(discovery.authorizationEndpoint);
  const parameters: Record<string, string> = {
    client_id: config.clientId,
    code_challenge: await sha256Base64Url(codeVerifier),
    code_challenge_method: 'S256',
    nonce,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid profile email',
    state,
  };
  if (prompt) parameters.prompt = prompt;
  authorizationUrl.search = new URLSearchParams(parameters).toString();
  return redirect(authorizationUrl.toString(), [serializeWebsiteCookie({
    appBaseUrl: config.appBaseUrl,
    maxAge: transactionLifetimeSeconds,
    name: websiteCookieName('transaction', config.appBaseUrl),
    value: await sealWebsiteValue(transaction, config.sessionSecret),
  })]);
}

async function exchangeCode(input: {
  readonly code: string;
  readonly config: WebsiteAuthConfig;
  readonly discovery: OidcDiscovery;
  readonly transaction: WebsiteAuthTransaction;
}): Promise<{ readonly accessToken: string; readonly expiresIn: number; readonly idToken: string }> {
  const response = await fetch(input.discovery.tokenEndpoint, {
    body: new URLSearchParams({
      client_id: input.config.clientId,
      code: input.code,
      code_verifier: input.transaction.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: new URL('/api/v1/auth/callback', input.config.appBaseUrl).toString(),
    }),
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('website_oidc_token_exchange_failed');
  const value: unknown = await response.json();
  if (!isRecord(value)
    || typeof value.access_token !== 'string'
    || typeof value.id_token !== 'string'
    || typeof value.expires_in !== 'number'
    || !Number.isFinite(value.expires_in)
    || value.expires_in <= 0) {
    throw new Error('invalid_website_oidc_token_response');
  }
  return { accessToken: value.access_token, expiresIn: value.expires_in, idToken: value.id_token };
}

export async function completeWebsiteCallback(request: Request, config: WebsiteAuthConfig): Promise<Response> {
  const transactionName = websiteCookieName('transaction', config.appBaseUrl);
  const sealedTransaction = readWebsiteCookie(request, transactionName);
  if (!sealedTransaction) throw new Error('missing_website_oidc_transaction');
  const transaction = parseTransaction(await unsealWebsiteValue(sealedTransaction, config.sessionSecret));
  const now = Math.floor(Date.now() / 1_000);
  if (now - transaction.createdAt > transactionLifetimeSeconds || transaction.createdAt > now + 30) {
    throw new Error('expired_website_oidc_transaction');
  }
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!state || state !== transaction.state) throw new Error('invalid_website_oidc_state');
  if (url.searchParams.has('error') || !code) throw new Error('website_oidc_authorization_failed');

  const discovery = await discoverWebsiteOidc(config.issuer);
  const token = await exchangeCode({ code, config, discovery, transaction });
  const verification = await jwtVerify(token.idToken, createRemoteJWKSet(new URL(discovery.jwksUri)), {
    audience: config.clientId,
    issuer: config.issuer,
  });
  if (verification.payload.nonce !== transaction.nonce || typeof verification.payload.sub !== 'string') {
    throw new Error('invalid_website_oidc_id_token');
  }
  const userInfo = await fetchWebsiteOidcUserInfo({
    accessToken: token.accessToken,
    endpoint: discovery.userInfoEndpoint,
    expectedSubject: verification.payload.sub,
  });
  const tokenExpiresAt = now + Math.floor(token.expiresIn);
  const expiresAt = Math.min(tokenExpiresAt, verification.payload.exp ?? tokenExpiresAt, now + maximumSessionLifetimeSeconds);
  const profile = parseWebsiteOidcProfile({ ...verification.payload, ...userInfo });
  const session: WebsiteSession = {
    displayName: profile.displayName,
    ...(profile.email ? { email: profile.email } : {}),
    expiresAt,
    issuer: config.issuer,
    ...(profile.pictureUrl ? { pictureUrl: profile.pictureUrl } : {}),
    subject: verification.payload.sub,
  };
  return redirect(new URL('/cuenta', config.appBaseUrl).toString(), [
    clearWebsiteCookie(transactionName, config.appBaseUrl),
    serializeWebsiteCookie({
      appBaseUrl: config.appBaseUrl,
      maxAge: Math.max(0, expiresAt - now),
      name: websiteCookieName('session', config.appBaseUrl),
      value: await sealWebsiteValue(session, config.sessionSecret),
    }),
  ]);
}

export async function readWebsiteSession(request: Request, config: WebsiteAuthConfig): Promise<WebsiteSession | null> {
  const sealedSession = readWebsiteCookie(request, websiteCookieName('session', config.appBaseUrl));
  if (!sealedSession) return null;
  try {
    const session = parseSession(await unsealWebsiteValue(sealedSession, config.sessionSecret));
    if (session.expiresAt <= Math.floor(Date.now() / 1_000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearWebsiteSession(config: WebsiteAuthConfig): string {
  return clearWebsiteCookie(websiteCookieName('session', config.appBaseUrl), config.appBaseUrl);
}
