import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPreviewEnvVars,
  configurePagesDev,
} from '../../scripts/cloudflare/configure-pages-dev.mjs';

test('builds preview-only website auth bindings with an encrypted session secret', () => {
  const envVars = buildPreviewEnvVars({
    baseUrl: 'https://dev.pueblo-magico-web.pages.dev',
    issuer: 'https://magico-auth.example.com',
    clientId: 'client-id',
    sessionSecret: 'session-secret-at-least-32-characters-long',
  });

  assert.equal(envVars.WEBSITE_BASE_URL.type, 'plain_text');
  assert.equal(envVars.MAGICO_AUTH_CLIENT_ID.value, 'client-id');
  assert.equal(envVars.WEBSITE_SESSION_SECRET.type, 'secret_text');
});

test('patches only the Pages preview environment', async () => {
  let request;
  await configurePagesDev({
    accountId: 'account-id',
    apiToken: 'token',
    projectName: 'pueblo-magico-web',
    envVars: { WEBSITE_BASE_URL: { type: 'plain_text', value: 'https://dev.example.com' } },
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options };
      return new Response(JSON.stringify({ success: true, result: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.options.method, 'PATCH');
  assert.equal(request.options.headers.Authorization, 'Bearer token');
  assert.equal(body.deployment_configs.preview.env_vars.WEBSITE_BASE_URL.value, 'https://dev.example.com');
  assert.equal(body.deployment_configs.production, undefined);
});

test('surfaces Cloudflare API errors', async () => {
  await assert.rejects(
    configurePagesDev({
      accountId: 'account-id',
      apiToken: 'token',
      projectName: 'pueblo-magico-web',
      envVars: {},
      fetchImpl: async () => new Response(
        JSON.stringify({ success: false, errors: [{ message: 'Invalid token' }] }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      ),
    }),
    /Invalid token/
  );
});
