import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const wrangler = readFileSync(new URL('../../wrangler.toml', import.meta.url), 'utf8');
const previewWorkflow = readFileSync(new URL('../../.github/workflows/preview.yml', import.meta.url), 'utf8');
const productionWorkflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');

test('Pages vincula previews a D1 preview y reserva env.production para producción', () => {
  const [previewConfig, productionConfig = ''] = wrangler.split('[[env.production.d1_databases]]');

  assert.match(previewConfig, /database_name = "magico-ensueno-db-preview"/);
  assert.match(previewConfig, /database_id = "d893fa4d-96d8-49f2-a9f5-d9feb55ab0d3"/);
  assert.doesNotMatch(previewConfig, /database_name = "magico-ensueno-db"\s*$/m);

  assert.match(productionConfig, /database_name = "magico-ensueno-db"/);
  assert.match(productionConfig, /database_id = "4431f6d6-052c-4f35-8fd7-4805b2d7a858"/);
});

test('los workflows seleccionan de forma explícita el entorno D1 correcto', () => {
  assert.doesNotMatch(previewWorkflow, /d1 (?:migrations apply|execute) DB[^\n]*--env production/);
  assert.doesNotMatch(previewWorkflow, /--env preview/);

  const comandosProduccion = productionWorkflow.match(/command: d1 (?:migrations apply|execute) DB[^\n]*/g) ?? [];
  assert.ok(comandosProduccion.length > 0);
  for (const comando of comandosProduccion) assert.match(comando, /--env production/);
});
