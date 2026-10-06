import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanupPreviewDeployments,
  listPreviewDeployments,
} from '../../scripts/cloudflare/cleanup-pages-preview.mjs';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('lists every page and selects only the requested preview branch', async () => {
  const requests = [];
  const pages = [
    {
      success: true,
      result: [
        {
          id: 'matching-1',
          deployment_trigger: { metadata: { branch: 'pr-42' } },
        },
        {
          id: 'other-pr',
          deployment_trigger: { metadata: { branch: 'pr-41' } },
        },
      ],
      result_info: { total_pages: 2 },
    },
    {
      success: true,
      result: [
        {
          id: 'matching-2',
          deployment_trigger: { metadata: { branch: 'pr-42' } },
        },
      ],
      result_info: { total_pages: 2 },
    },
  ];

  const deployments = await listPreviewDeployments({
    accountId: 'account-id',
    apiToken: 'token',
    projectName: 'pueblo-magico-web',
    branch: 'pr-42',
    fetchImpl: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return jsonResponse(pages[requests.length - 1]);
    },
  });

  assert.deepEqual(
    deployments.map(deployment => deployment.id),
    ['matching-1', 'matching-2']
  );
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url.searchParams.get('env'), 'preview');
  assert.equal(requests[1].url.searchParams.get('page'), '2');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token');
});

test('deletes all matching deployments with force enabled', async () => {
  const deleted = [];

  const count = await cleanupPreviewDeployments({
    accountId: 'account-id',
    apiToken: 'token',
    projectName: 'pueblo-magico-web',
    branch: 'pr-42',
    fetchImpl: async (url, options = {}) => {
      const requestUrl = new URL(url);

      if (options.method === 'DELETE') {
        deleted.push({ url: requestUrl, options });
        return jsonResponse({ success: true, result: null });
      }

      return jsonResponse({
        success: true,
        result: [
          {
            id: 'deployment-a',
            url: 'https://a.example.pages.dev',
            deployment_trigger: { metadata: { branch: 'pr-42' } },
          },
          {
            id: 'deployment-b',
            url: 'https://b.example.pages.dev',
            deployment_trigger: { metadata: { branch: 'pr-42' } },
          },
        ],
        result_info: { total_pages: 1 },
      });
    },
  });

  assert.equal(count, 2);
  assert.equal(deleted.length, 2);
  assert.deepEqual(
    deleted.map(request => request.url.pathname.split('/').at(-1)),
    ['deployment-a', 'deployment-b']
  );
  assert.ok(deleted.every(request => request.url.searchParams.get('force') === 'true'));
  assert.ok(deleted.every(request => request.options.method === 'DELETE'));
});

test('fails with the Cloudflare error message', async () => {
  await assert.rejects(
    listPreviewDeployments({
      accountId: 'account-id',
      apiToken: 'token',
      projectName: 'pueblo-magico-web',
      branch: 'pr-42',
      fetchImpl: async () =>
        jsonResponse({ success: false, errors: [{ message: 'Invalid API token' }] }, 403),
    }),
    /Invalid API token/
  );
});
