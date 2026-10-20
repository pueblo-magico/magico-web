import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activateMercadoPagoCheckout,
} from '../../scripts/cloudflare/activate-mercado-pago-checkout.mjs';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('activates only the preview checkout switch when the access token exists', async () => {
  const requests = [];
  const result = await activateMercadoPagoCheckout({
    accountId: 'account-id', apiToken: 'api-token', projectName: 'pueblo-magico-web',
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: String(url), options });
      if (options.method === 'PATCH') return jsonResponse({ success: true, result: {} });
      return jsonResponse({
        success: true,
        result: {
          deployment_configs: {
            preview: {
              env_vars: {
                MP_ACCESS_TOKEN: { type: 'secret_text', value: '' },
                OTHER_SECRET: { type: 'secret_text', value: '' },
                MP_CHECKOUT_ENABLED: { type: 'plain_text', value: 'false' },
              },
            },
          },
        },
      });
    },
  });

  assert.deepEqual(result, { changed: true });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    deployment_configs: {
      preview: {
        env_vars: {
          MP_CHECKOUT_ENABLED: { type: 'plain_text', value: 'true' },
        },
      },
    },
  });
  assert.doesNotMatch(requests[1].options.body, /OTHER_SECRET|MP_ACCESS_TOKEN/);
});

test('does not update Cloudflare when checkout is already active', async () => {
  let calls = 0;
  const result = await activateMercadoPagoCheckout({
    accountId: 'account-id', apiToken: 'api-token', projectName: 'pueblo-magico-web',
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({
        success: true,
        result: { deployment_configs: { preview: { env_vars: {
          MP_ACCESS_TOKEN: { type: 'secret_text', value: '' },
          MP_CHECKOUT_ENABLED: { type: 'plain_text', value: 'true' },
        } } } },
      });
    },
  });

  assert.deepEqual(result, { changed: false });
  assert.equal(calls, 1);
});

test('fails closed without a Mercado Pago access token', async () => {
  await assert.rejects(activateMercadoPagoCheckout({
    accountId: 'account-id', apiToken: 'api-token', projectName: 'pueblo-magico-web',
    fetchImpl: async () => jsonResponse({
      success: true,
      result: { deployment_configs: { preview: { env_vars: {
        MP_CHECKOUT_ENABLED: { type: 'plain_text', value: 'false' },
      } } } },
    }),
  }), /MP_ACCESS_TOKEN is not configured/);
});

test('rejects an unknown Pages environment before reading Cloudflare', async () => {
  await assert.rejects(activateMercadoPagoCheckout({
    accountId: 'account-id', apiToken: 'api-token', projectName: 'pueblo-magico-web',
    environment: 'branch', fetchImpl: async () => { throw new Error('must not fetch'); },
  }), /must be preview or production/);
});
