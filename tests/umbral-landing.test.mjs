import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

test('UMBRAL copy and calendar card exist in both languages', () => {
  const content = JSON.parse(read('data.json'));
  for (const language of ['es', 'en']) {
    const page = content[language].umbral;
    assert.equal(page.hero.title, 'HUELLA SONORA');
    assert.ok(page.hero.subtitle.length > 8);
    assert.equal(page.program.days.length, 4);
    assert.equal(page.explore.items.length, 4);
    assert.equal(page.faq.items.length, 10);
    assert.match(page.investment.earlyPrice, /710/);
    assert.match(page.investment.regularAmount, /820/);
    assert.match(page.investment.depositPrice, /190/);
    assert.match(page.stay.loan, /didgeridoo|préstamo|loan/i);
    assert.match(page.whatsapp, /HUELLA SONORA/);
    const events = content[language].events.cards.filter(card => card.link === '/retiros/umbral-el-viaje-de-la-escucha');
    assert.equal(events.length, 1);
    assert.equal(events[0].startDate, '2027-01-08');
    assert.equal(events[0].endDate, '2027-01-11');
    assert.equal(events[0].showInMainEvents, true);
    assert.match(events[0].title, /HUELLA SONORA/);
  }
});

test('UMBRAL is routed, prerendered, and listed in the sitemap', () => {
  assert.match(read('index.tsx'), /const Umbral = lazy\(\(\) => import\('\.\/src\/Umbral'\)\)/);
  assert.match(read('index.tsx'), /ROUTES\.UMBRAL.*<Umbral/);
  assert.match(read('src/routes.ts'), /UMBRAL: '\/retiros\/umbral-el-viaje-de-la-escucha'/);
  assert.match(read('scripts/prerender.mjs'), /path: '\/retiros\/umbral-el-viaje-de-la-escucha'/);
  assert.match(read('scripts/prerender.mjs'), /umbral-event-schema/);
  assert.match(read('public/sitemap.xml'), /\/retiros\/umbral-el-viaje-de-la-escucha<\/loc>/);
});

test('UMBRAL reuses site chrome and optimized photography', () => {
  const page = read('src/Umbral.tsx');
  assert.match(page, /useLanguage\(\)/);
  assert.match(page, /t\.umbral/);
  assert.match(page, /<Header /);
  assert.match(page, /<Footer\s*\/>/);
  assert.match(page, /<CookieBanner\s*\/>/);
  assert.match(page, /fetchPriority="high"/);
  assert.match(page, /loading="lazy"\s+decoding="async"/);
  assert.match(page, /WA_UMBRAL/);
  assert.doesNotMatch(page, /[\u{1F300}-\u{1FAFF}]/u);
});
