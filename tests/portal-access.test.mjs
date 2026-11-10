import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the public website exposes one access chooser for customers and staff', () => {
  const index = read('index.tsx');
  const routes = read('src/routes.ts');
  const header = read('components/Header.tsx');
  const accessPage = read('src/Ingresar.tsx');

  assert.match(routes, /LOGIN:\s*['"]\/ingresar['"]/);
  assert.match(index, /path=\{ROUTES\.LOGIN\}/);
  assert.match(index, /<Ingresar\s*\/>/);
  assert.match(header, /href=\{ROUTES\.LOGIN\}/);
  assert.match(header, /Ingresar/);

  assert.match(accessPage, /Mi cuenta/);
  assert.match(accessPage, /Solo para el equipo/);
  assert.match(accessPage, /Acceso del equipo/);
  assert.match(accessPage, /Ingresar a Mi cuenta/);
  assert.match(accessPage, /Ingresar al portal del equipo/);
  assert.match(accessPage, /COMPANION_PORTAL_URL/);
  assert.match(accessPage, /STAFF_PORTAL_URL/);
  assert.doesNotMatch(accessPage, /localStorage|sessionStorage|document\.cookie|fetch\(/);
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
