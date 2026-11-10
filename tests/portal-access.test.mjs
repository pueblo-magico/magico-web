import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the public website exposes one website-owned account entry', () => {
  const index = read('index.tsx');
  const routes = read('src/routes.ts');
  const header = read('components/Header.tsx');
  const accountControl = read('components/AccountControl.tsx');
  const accessPage = read('src/Cuenta.tsx');
  const prerender = read('scripts/prerender.mjs');

  assert.match(routes, /ACCOUNT:\s*['"]\/cuenta['"]/);
  assert.doesNotMatch(routes, /\/ingresar/);
  assert.match(prerender, /path:\s*['"]\/cuenta['"]/);
  assert.doesNotMatch(prerender, /\/ingresar/);
  assert.match(index, /path=\{ROUTES\.ACCOUNT\}/);
  assert.match(index, /<Cuenta\s*\/>/);
  assert.match(header, /useWebsiteAccount/);
  assert.match(header, /<AccountControl/);
  assert.match(header, /<AccountControl compact/);
  assert.match(header, /max-width: 1023px/);
  assert.match(header, /lg:grid-cols-\[minmax\(170px,1fr\)_auto_minmax\(170px,1fr\)\]/);
  assert.match(accountControl, /WEBSITE_LOGIN_URL/);
  assert.match(accountControl, /LogIn/);
  assert.match(accountControl, /accountInitial/);
  assert.match(accountControl, /bg-emerald-400/);
  assert.match(accountControl, /authenticatedClasses/);
  assert.match(accountControl, /Mi cuenta/);
  assert.match(accountControl, /ChevronDown/);
  assert.match(accountControl, /className="sr-only"/);
  assert.match(accountControl, /Portal del equipo/);
  assert.match(accountControl, /staffAccess === 'allowed'/);
  assert.match(accountControl, /Cerrar sesión de Mi cuenta/);
  assert.match(accountControl, /Cambiar de cuenta/);
  assert.match(accessPage, /Mi cuenta/);
  assert.match(accessPage, /WEBSITE_LOGIN_URL/);
  assert.match(accessPage, /COMPANION_PORTAL_URL/);
  assert.doesNotMatch(accessPage, /STAFF_PORTAL_URL|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(accountControl, /localStorage|sessionStorage|document\.cookie/);
  assert.match(header, /inline-flex h-10 items-center justify-center/);
});

test('portal destinations are configured independently for development and production', () => {
  const config = read('src/data/config.ts');
  const exampleEnv = read('.env.example');
  const pullRequestWorkflow = read('.github/workflows/preview.yml');
  const developmentWorkflow = read('.github/workflows/deploy-dev.yml');
  const productionWorkflow = read('.github/workflows/deploy.yml');

  assert.match(config, /VITE_COMPANION_PORTAL_URL/);
  assert.match(config, /VITE_STAFF_PORTAL_URL/);
  assert.match(config, /VITE_WEBSITE_LOGIN_URL/);
  assert.match(config, /\/api\/v1\/auth\/login/);
  assert.match(config, /https:\/\/mi\.experienciamagico\.com/);
  assert.match(config, /https:\/\/admin\.experienciamagico\.com/);
  assert.match(exampleEnv, /VITE_COMPANION_PORTAL_URL=/);
  assert.match(exampleEnv, /VITE_STAFF_PORTAL_URL=/);
  assert.match(exampleEnv, /VITE_WEBSITE_LOGIN_URL=/);
  assert.doesNotMatch(pullRequestWorkflow, /wrangler-action|pages deploy|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID/);
  assert.match(developmentWorkflow, /environment:\s*development/);
  assert.match(developmentWorkflow, /magico-companion-dev\.dev-pueblomagico\.workers\.dev/);
  assert.match(developmentWorkflow, /magico-staff-portal-dev\.dev-pueblomagico\.workers\.dev/);
  assert.match(developmentWorkflow, /configure-dev-d1\.mjs/);
  assert.match(developmentWorkflow, /MAGICO_WEB_DEV_D1_DATABASE_ID/);
  assert.match(developmentWorkflow, /apiToken:\s*\$\{\{ secrets\.CLOUDFLARE_DEV_API_TOKEN \}\}/);
  assert.match(developmentWorkflow, /accountId:\s*\$\{\{ vars\.CLOUDFLARE_DEV_ACCOUNT_ID \}\}/);
  assert.doesNotMatch(developmentWorkflow, /secrets\.CLOUDFLARE_API_TOKEN|vars\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(developmentWorkflow, /pages deploy dist --project-name=pueblo-magico-web --branch=main/);
  assert.match(productionWorkflow, /VITE_COMPANION_PORTAL_URL/);
  assert.match(productionWorkflow, /VITE_STAFF_PORTAL_URL/);
});
