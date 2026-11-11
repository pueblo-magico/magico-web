import test from 'node:test';
import assert from 'node:assert/strict';

import { readWebsiteAuthConfig } from '../functions/_lib/websiteAuthConfig.ts';
import { serializeWebsiteCookie, websiteCookieName } from '../functions/_lib/websiteAuthCookies.ts';
import { sealWebsiteValue, unsealWebsiteValue } from '../functions/_lib/websiteAuthCrypto.ts';
import {
  beginWebsiteLogin,
  fetchWebsiteOidcUserInfo,
  parseWebsiteOidcProfile,
  readWebsiteSession,
} from '../functions/_lib/websiteOidc.ts';

const config = {
  appBaseUrl: new URL('https://dev.pueblo-magico-web.pages.dev'),
  clientId: 'website-client',
  issuer: 'https://magico-auth.example.com',
  sessionSecret: 'a-secure-website-session-secret-32-characters',
};

test('website auth config rejects unsafe URLs and short secrets', () => {
  assert.throws(() => readWebsiteAuthConfig({
    MAGICO_AUTH_CLIENT_ID: 'client',
    MAGICO_AUTH_ISSUER: 'https://magico-auth.example.com',
    WEBSITE_BASE_URL: 'https://dev.pueblo-magico-web.pages.dev?redirect=https://attacker.example',
    WEBSITE_SESSION_SECRET: config.sessionSecret,
  }), /invalid_website_base_url/);
  assert.throws(() => readWebsiteAuthConfig({
    MAGICO_AUTH_CLIENT_ID: 'client',
    MAGICO_AUTH_ISSUER: 'https://magico-auth.example.com',
    WEBSITE_BASE_URL: 'https://dev.pueblo-magico-web.pages.dev',
    WEBSITE_SESSION_SECRET: 'short',
  }), /invalid_website_session_secret/);
});

test('website session values are encrypted and tamper evident', async () => {
  const sealed = await sealWebsiteValue({ subject: 'user-1' }, config.sessionSecret);
  assert.doesNotMatch(sealed, /user-1/);
  assert.deepEqual(await unsealWebsiteValue(sealed, config.sessionSecret), { subject: 'user-1' });
  await assert.rejects(() => unsealWebsiteValue(`${sealed}x`, config.sessionSecret), /invalid_website_sealed_value/);
});

test('website login uses authorization code, PKCE and an HttpOnly transaction cookie', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    authorization_endpoint: 'https://magico-auth.example.com/oauth/v2/authorize',
    issuer: config.issuer,
    jwks_uri: 'https://magico-auth.example.com/oauth/v2/keys',
    token_endpoint: 'https://magico-auth.example.com/oauth/v2/token',
    userinfo_endpoint: 'https://magico-auth.example.com/oidc/v1/userinfo',
  }), { status: 200 });

  const response = await beginWebsiteLogin(config);
  const location = new URL(response.headers.get('Location'));
  assert.equal(response.status, 302);
  assert.equal(location.searchParams.get('response_type'), 'code');
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(location.searchParams.get('redirect_uri'), 'https://dev.pueblo-magico-web.pages.dev/api/v1/auth/callback');
  assert.match(response.headers.get('Set-Cookie'), /__Host-magico_web_transaction=/);
  assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
  assert.match(response.headers.get('Set-Cookie'), /Secure/);
  assert.doesNotMatch(response.headers.get('Set-Cookie'), /codeVerifier/);
});

test('account switching requests provider account selection', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    authorization_endpoint: 'https://magico-auth.example.com/oauth/v2/authorize',
    issuer: config.issuer,
    jwks_uri: 'https://magico-auth.example.com/oauth/v2/keys',
    token_endpoint: 'https://magico-auth.example.com/oauth/v2/token',
    userinfo_endpoint: 'https://magico-auth.example.com/oidc/v1/userinfo',
  }), { status: 200 });
  const response = await beginWebsiteLogin(config, 'select_account');
  assert.equal(new URL(response.headers.get('Location')).searchParams.get('prompt'), 'select_account');
});

test('website session rejects expired and modified cookies', async () => {
  const cookieName = websiteCookieName('session', config.appBaseUrl);
  const expired = await sealWebsiteValue({
    displayName: 'Jas',
    expiresAt: Math.floor(Date.now() / 1_000) - 1,
    issuer: config.issuer,
    subject: 'user-1',
  }, config.sessionSecret);
  const expiredCookie = serializeWebsiteCookie({ appBaseUrl: config.appBaseUrl, maxAge: 60, name: cookieName, value: expired });
  assert.equal(await readWebsiteSession(new Request(config.appBaseUrl, { headers: { Cookie: expiredCookie } }), config), null);
  const modifiedCookie = serializeWebsiteCookie({ appBaseUrl: config.appBaseUrl, maxAge: 60, name: cookieName, value: `${expired}x` });
  assert.equal(await readWebsiteSession(new Request(config.appBaseUrl, { headers: { Cookie: modifiedCookie } }), config), null);
});

test('website profile prefers the verified userinfo name over an email fallback', () => {
  assert.deepEqual(parseWebsiteOidcProfile({
    email: 'test@example.com',
    name: 'Jasper Meyer',
    picture: 'https://images.example.com/jasper.jpg',
    sub: 'user-1',
  }), {
    displayName: 'Jasper Meyer',
    email: 'test@example.com',
    pictureUrl: 'https://images.example.com/jasper.jpg',
  });
  assert.equal(parseWebsiteOidcProfile({
    email: 'test@example.com',
    family_name: 'Meyer',
    given_name: 'Jasper',
  }).displayName, 'Jasper Meyer');
});

test('website userinfo validates the authenticated subject', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (_input, init) => {
    assert.equal(init.headers.Authorization, 'Bearer access-token');
    return new Response(JSON.stringify({ name: 'Jasper Meyer', sub: 'user-1' }), { status: 200 });
  };
  await assert.doesNotReject(() => fetchWebsiteOidcUserInfo({
    accessToken: 'access-token',
    endpoint: 'https://magico-auth.example.com/oidc/v1/userinfo',
    expectedSubject: 'user-1',
  }));
  await assert.rejects(() => fetchWebsiteOidcUserInfo({
    accessToken: 'access-token',
    endpoint: 'https://magico-auth.example.com/oidc/v1/userinfo',
    expectedSubject: 'another-user',
  }), /invalid_website_oidc_userinfo/);
});

test('website login rejects discovery from another issuer', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    authorization_endpoint: 'https://attacker.example/authorize',
    issuer: 'https://attacker.example',
    jwks_uri: 'https://attacker.example/keys',
    token_endpoint: 'https://attacker.example/token',
    userinfo_endpoint: 'https://attacker.example/userinfo',
  }), { status: 200 });
  await assert.rejects(() => beginWebsiteLogin(config), /invalid_website_oidc_discovery/);
});
