import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const data = JSON.parse(readFileSync(new URL('../data.json', import.meta.url), 'utf8'));
const routeSource = readFileSync(new URL('../src/routes.ts', import.meta.url), 'utf8');
const entrySource = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../src/Temazcal.tsx', import.meta.url), 'utf8');
const prerenderSource = readFileSync(new URL('../scripts/prerender.mjs', import.meta.url), 'utf8');

test('Temazcal has a public route and static metadata', () => {
  assert.match(routeSource, /TEMAZCAL:\s*'\/temazcal'/);
  assert.match(entrySource, /ROUTES\.TEMAZCAL/);
  assert.match(prerenderSource, /path:\s*'\/temazcal'/);
});

test('confirmed Temazcal dates link to the explanatory landing', () => {
  for (const language of ['es', 'en']) {
    const events = data[language].events.cards.filter((event) => event.isTemazcal);
    assert.ok(events.length > 0);
    assert.ok(events.every((event) => event.link === '/temazcal'));
    assert.ok(events.every((event) => event.contactLink?.startsWith('https://wa.me/')));
  }
});

test('landing explains cultural origin, variability, care and dynamic dates', () => {
  assert.match(pageSource, /raíz mesoamericana/);
  assert.match(pageSource, /No existe un único protocolo universal/);
  assert.match(pageSource, /No se trata de resistir ni de demostrar nada/);
  assert.match(pageSource, /event\.isTemazcal/);
  assert.match(pageSource, /relatedToTemazcal/);
});
