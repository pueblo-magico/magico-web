import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';

function required(value, name) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing required environment variable: ${name}`);
  return normalized;
}

export function buildPreviewEnvVars({ baseUrl, issuer, clientId, sessionSecret }) {
  return {
    WEBSITE_BASE_URL: { type: 'plain_text', value: required(baseUrl, 'WEBSITE_BASE_URL') },
    MAGICO_AUTH_ISSUER: { type: 'plain_text', value: required(issuer, 'MAGICO_AUTH_ISSUER') },
    MAGICO_AUTH_CLIENT_ID: { type: 'plain_text', value: required(clientId, 'MAGICO_AUTH_CLIENT_ID') },
    WEBSITE_SESSION_SECRET: {
      type: 'secret_text',
      value: required(sessionSecret, 'WEBSITE_SESSION_SECRET'),
    },
  };
}

export async function configurePagesDev({ accountId, apiToken, projectName, envVars, fetchImpl = fetch }) {
  const url = new URL(
    `${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}`
  );
  const response = await fetchImpl(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deployment_configs: { preview: { env_vars: envVars } } }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    const details = payload?.errors?.map(error => error.message).filter(Boolean).join('; ');
    throw new Error(`Configuring DEV Pages bindings failed (${response.status})${details ? `: ${details}` : '.'}`);
  }
}

async function main() {
  const envVars = buildPreviewEnvVars({
    baseUrl: process.env.WEBSITE_BASE_URL,
    issuer: process.env.MAGICO_AUTH_ISSUER,
    clientId: process.env.MAGICO_AUTH_CLIENT_ID,
    sessionSecret: randomBytes(48).toString('base64url'),
  });
  await configurePagesDev({
    accountId: required(process.env.CLOUDFLARE_ACCOUNT_ID, 'CLOUDFLARE_ACCOUNT_ID'),
    apiToken: required(process.env.CLOUDFLARE_API_TOKEN, 'CLOUDFLARE_API_TOKEN'),
    projectName: required(process.env.CLOUDFLARE_PROJECT_NAME, 'CLOUDFLARE_PROJECT_NAME'),
    envVars,
  });
  console.log('Configured preview auth bindings for the stable Cloudflare Pages dev branch.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
