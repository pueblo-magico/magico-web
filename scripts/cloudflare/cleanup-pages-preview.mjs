import { pathToFileURL } from 'node:url';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const PAGE_SIZE = 100;

function requireValue(value, name) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function readResponse(response, operation) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`${operation} returned an invalid JSON response (${response.status}).`);
  }

  if (!response.ok || payload.success !== true) {
    const details = payload.errors
      ?.map(error => error.message)
      .filter(Boolean)
      .join('; ');
    throw new Error(`${operation} failed (${response.status})${details ? `: ${details}` : '.'}`);
  }

  return payload;
}

function deploymentPath(accountId, projectName) {
  return [
    'accounts',
    encodeURIComponent(accountId),
    'pages',
    'projects',
    encodeURIComponent(projectName),
    'deployments',
  ].join('/');
}

export async function listPreviewDeployments({
  accountId,
  apiToken,
  projectName,
  branch,
  fetchImpl = fetch,
}) {
  const matches = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = new URL(`${API_BASE_URL}/${deploymentPath(accountId, projectName)}`);
    url.search = new URLSearchParams({
      env: 'preview',
      page: String(page),
      per_page: String(PAGE_SIZE),
    });

    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const payload = await readResponse(response, `Listing Cloudflare deployments (page ${page})`);

    matches.push(
      ...payload.result.filter(
        deployment => deployment.deployment_trigger?.metadata?.branch === branch
      )
    );

    totalPages = payload.result_info?.total_pages ?? page;
    page += 1;
  } while (page <= totalPages);

  return matches;
}

export async function deletePreviewDeployment({
  accountId,
  apiToken,
  projectName,
  deploymentId,
  fetchImpl = fetch,
}) {
  const url = new URL(
    `${API_BASE_URL}/${deploymentPath(accountId, projectName)}/${encodeURIComponent(deploymentId)}`
  );
  // A branch alias normally points at the newest preview, which requires force.
  url.searchParams.set('force', 'true');

  const response = await fetchImpl(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  await readResponse(response, `Deleting Cloudflare deployment ${deploymentId}`);
}

export async function cleanupPreviewDeployments(options) {
  const deployments = await listPreviewDeployments(options);

  for (const deployment of deployments) {
    console.log(`Deleting ${deployment.id} for ${options.branch} (${deployment.url ?? 'no URL'})`);
    await deletePreviewDeployment({ ...options, deploymentId: deployment.id });
  }

  return deployments.length;
}

async function main() {
  const options = {
    accountId: requireValue(process.env.CLOUDFLARE_ACCOUNT_ID, 'CLOUDFLARE_ACCOUNT_ID'),
    apiToken: requireValue(process.env.CLOUDFLARE_API_TOKEN, 'CLOUDFLARE_API_TOKEN'),
    projectName: requireValue(process.env.CLOUDFLARE_PROJECT_NAME, 'CLOUDFLARE_PROJECT_NAME'),
    branch: requireValue(process.env.CLOUDFLARE_PREVIEW_BRANCH, 'CLOUDFLARE_PREVIEW_BRANCH'),
  };

  const deleted = await cleanupPreviewDeployments(options);
  console.log(
    deleted === 0
      ? `No Cloudflare preview deployments found for ${options.branch}.`
      : `Deleted ${deleted} Cloudflare preview deployment${deleted === 1 ? '' : 's'} for ${options.branch}.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
