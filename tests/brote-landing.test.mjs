import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

test('BROTE is an upcoming event in both calendar languages', () => {
  const content = JSON.parse(read('data.json'));
  for (const language of ['es', 'en']) {
    const events = content[language].events.cards.filter(card => card.link === '/brote-ronda-de-mujeres');
    assert.equal(events.length, 1);
    assert.equal(events[0].startDate, '2026-11-06');
    assert.equal(events[0].endDate, '2026-11-08');
    assert.match(events[0].title, /BROTE/);
    assert.ok(events[0].desc.length > 45);
  }
});

test('BROTE is lazy-loaded and included in static prerender, SEO, and sitemap', () => {
  assert.match(read('index.tsx'), /const Brote = lazy\(\(\) => import\('\.\/src\/Brote'\)\)/);
  assert.match(read('index.tsx'), /ROUTES\.BROTE.*<Brote/);
  assert.match(read('src/routes.ts'), /BROTE: '\/brote-ronda-de-mujeres'/);
  assert.match(read('scripts/prerender.mjs'), /path: '\/brote-ronda-de-mujeres'/);
  assert.match(read('scripts/prerender.mjs'), /brote-event-schema/);
  assert.match(read('public/sitemap.xml'), /\/brote-ronda-de-mujeres<\/loc>/);
});

test('BROTE includes reusable cookie consent and responsive optimized imagery', () => {
  const page = read('src/Brote.tsx');
  assert.match(page, /<CookieBanner\s*\/>/);
  assert.match(page, /from '\.\.\/components\/CookieBanner'/);
  assert.match(page, /loading="lazy" decoding="async"/);
  assert.match(page, /fetchPriority="high"/);
  assert.match(page, /<Footer\s*\/>/);
});
