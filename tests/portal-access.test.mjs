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
  assert.match(header, /max-width: 1279px/);
  assert.match(header, /xl:grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(accountControl, /\/api\/v1\/auth\/login/);
  assert.match(accountControl, /Mi cuenta/);
  assert.match(accountControl, /ChevronDown/);
  assert.match(accountControl, /className="sr-only"/);
  assert.match(accountControl, /Portal del equipo/);
  assert.match(accountControl, /staffAccess === 'allowed'/);
  assert.match(accountControl, /Cerrar sesión de Mi cuenta/);
  assert.match(accountControl, /Cambiar de cuenta/);
  assert.match(accessPage, /Mi cuenta/);
  assert.match(accessPage, /\/api\/v1\/auth\/login/);
  assert.match(accessPage, /COMPANION_PORTAL_URL/);
  assert.doesNotMatch(accessPage, /STAFF_PORTAL_URL|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(accountControl, /localStorage|sessionStorage|document\.cookie/);
});

test('portal destinations are configured independently for preview and production', () => {
  const config = read('src/data/config.ts');
  const exampleEnv = read('.env.example');
  const previewWorkflow = read('.github/workflows/preview.yml');
  const productionWorkflow = read('.github/workflows/deploy.yml');

  assert.match(config, /VITE_COMPANION_PORTAL_URL/);
  assert.match(config, /VITE_STAFF_PORTAL_URL/);
  assert.match(config, /https:\/\/mi\.experienciamagico\.com/);
  assert.match(config, /https:\/\/admin\.experienciamagico\.com/);
  assert.match(exampleEnv, /VITE_COMPANION_PORTAL_URL=/);
  assert.match(exampleEnv, /VITE_STAFF_PORTAL_URL=/);
  assert.match(previewWorkflow, /magico-companion-dev\.dev-pueblomagico\.workers\.dev/);
  assert.match(previewWorkflow, /magico-staff-portal-dev\.dev-pueblomagico\.workers\.dev/);
  assert.match(productionWorkflow, /VITE_COMPANION_PORTAL_URL/);
  assert.match(productionWorkflow, /VITE_STAFF_PORTAL_URL/);
});
