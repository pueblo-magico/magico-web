import { pathToFileURL } from 'node:url';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const MAX_PAGES = 1000;

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

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function nextPage(resultInfo, requestedPage, resultCount) {
  const currentPage = positiveInteger(resultInfo?.page) ?? requestedPage;
  const totalPages = positiveInteger(resultInfo?.total_pages);
  if (totalPages !== null) return currentPage < totalPages ? currentPage + 1 : null;

  const perPage = positiveInteger(resultInfo?.per_page);
  const totalCount = positiveInteger(resultInfo?.total_count);
  if (perPage !== null && totalCount !== null) {
    return currentPage * perPage < totalCount ? currentPage + 1 : null;
  }

  // Without trustworthy pagination metadata, a short or empty page is the
  // only safe indication that the listing is complete. Cloudflare normally
  // returns result_info, so this is a defensive compatibility fallback.
  return perPage !== null && resultCount >= perPage ? currentPage + 1 : null;
}

export async function listPreviewDeployments({
  accountId,
  apiToken,
  projectName,
  branch,
  fetchImpl = fetch,
}) {
  const matches = new Map();
  let page = 1;

  while (page !== null) {
    if (page > MAX_PAGES) {
      throw new Error(`Cloudflare pagination exceeded the safety limit of ${MAX_PAGES} pages.`);
    }
    const url = new URL(`${API_BASE_URL}/${deploymentPath(accountId, projectName)}`);
    url.searchParams.set('env', 'preview');
    // The Pages API has rejected explicit page=1/per_page combinations in
    // production despite documenting them. Let Cloudflare choose its first
    // page size and only request a page number when metadata says one exists.
    if (page > 1) url.searchParams.set('page', String(page));

    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const payload = await readResponse(response, `Listing Cloudflare deployments (page ${page})`);
    if (!Array.isArray(payload.result)) {
      throw new Error(`Listing Cloudflare deployments (page ${page}) returned an invalid result.`);
    }

    for (const deployment of payload.result) {
      if (deployment.deployment_trigger?.metadata?.branch === branch && deployment.id) {
        matches.set(deployment.id, deployment);
      }
    }

    page = nextPage(payload.result_info, page, payload.result.length);
  }

  return [...matches.values()];
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
