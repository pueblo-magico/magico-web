import { pathToFileURL } from 'node:url';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';

function requireValue(value, name) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
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
    const details = payload.errors?.map(error => error.message).filter(Boolean).join('; ');
    throw new Error(`${operation} failed (${response.status})${details ? `: ${details}` : '.'}`);
  }
  return payload;
}

function projectUrl(accountId, projectName) {
  return `${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`;
}

export async function activateMercadoPagoCheckout({
  accountId,
  apiToken,
  projectName,
  environment = 'preview',
  fetchImpl = fetch,
}) {
  if (environment !== 'preview' && environment !== 'production') {
    throw new Error('CLOUDFLARE_PAGES_ENVIRONMENT must be preview or production.');
  }
  const url = projectUrl(accountId, projectName);
  const headers = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
  const current = await readResponse(
    await fetchImpl(url, { headers }),
    `Reading Cloudflare Pages ${environment} configuration`
  );
  const envVars = current.result?.deployment_configs?.[environment]?.env_vars;
  if (!envVars || !envVars.MP_ACCESS_TOKEN) {
    throw new Error(
      `MP_ACCESS_TOKEN is not configured for the Cloudflare Pages ${environment} environment.`
    );
  }
  if (envVars.MP_CHECKOUT_ENABLED?.type === 'plain_text' &&
      envVars.MP_CHECKOUT_ENABLED.value === 'true') {
    return { changed: false };
  }

  await readResponse(await fetchImpl(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      deployment_configs: {
        [environment]: {
          env_vars: {
            MP_CHECKOUT_ENABLED: { type: 'plain_text', value: 'true' },
          },
        },
      },
    }),
  }), `Activating Mercado Pago checkout for Cloudflare Pages ${environment}`);
  return { changed: true };
}

async function main() {
  const environment = process.env.CLOUDFLARE_PAGES_ENVIRONMENT || 'preview';
  const result = await activateMercadoPagoCheckout({
    accountId: requireValue(process.env.CLOUDFLARE_ACCOUNT_ID, 'CLOUDFLARE_ACCOUNT_ID'),
    apiToken: requireValue(process.env.CLOUDFLARE_API_TOKEN, 'CLOUDFLARE_API_TOKEN'),
    projectName: requireValue(process.env.CLOUDFLARE_PROJECT_NAME, 'CLOUDFLARE_PROJECT_NAME'),
    environment,
  });
  console.log(result.changed
    ? `Mercado Pago checkout activated for Cloudflare Pages ${environment}.`
    : `Mercado Pago checkout was already active for Cloudflare Pages ${environment}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
