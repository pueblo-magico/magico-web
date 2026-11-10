import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('regeneration pillar links to the reforestation page', () => {
  const source = read('components/SectionPilares.tsx');

  assert.match(source, /pillar\.id === 1/);
  assert.match(source, /href=\{ROUTES\.REFORESTACION\}/);
});

test('first pillar is regeneration in both languages', () => {
  const content = JSON.parse(read('data.json'));

  assert.equal(content.es.pillars.find(pillar => pillar.id === 1)?.title, 'Regeneración');
  assert.equal(content.en.pillars.find(pillar => pillar.id === 1)?.title, 'Regeneration');
});
