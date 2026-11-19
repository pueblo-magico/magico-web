import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Temazcal has a dedicated routable and prerendered landing page', () => {
  const routes = read('src/routes.ts');
  const entry = read('index.tsx');
  const prerender = read('scripts/prerender.mjs');
  const sitemap = read('public/sitemap.xml');
  const smokeRoutes = read('scripts/check-routes.mjs');

  assert.match(routes, /TEMAZCAL:\s*'\/temazcal'/);
  assert.match(entry, /import\('\.\/src\/Temazcal'\)/);
  assert.match(entry, /path=\{ROUTES\.TEMAZCAL\}/);
  assert.match(prerender, /path:\s*'\/temazcal'/);
  assert.match(prerender, /canonical:\s*'https:\/\/experienciamagico\.com\/temazcal'/);
  assert.match(sitemap, /<loc>https:\/\/experienciamagico\.com\/temazcal<\/loc>/);
  assert.match(smokeRoutes, /'\/temazcal'/);
});

test('Temazcal explains the ceremony, how it is held and what it sustains', () => {
  const page = read('src/Temazcal.tsx');
  const header = read('components/Header.tsx');

  for (const copy of [
    'La ceremonia',
    'Cómo lo compartimos',
    'Lo que sostiene en Pueblo Mágico',
    'Participación voluntaria',
    'Rezo y escucha',
    'Integración',
    'Comunidad y territorio',
  ]) assert.ok(page.includes(copy), `missing Temazcal copy: ${copy}`);

  assert.match(page, /href="\/#eventos"/);
  assert.match(page, /<Header alwaysSolid \/>/);
  assert.match(header, /alwaysSolid \|\| isScrolled \|\| isMobileMenuOpen/);
  assert.match(header, /usesStackedHeaderLayout = Boolean\(subNavigation \|\| useAutoSubNavigation\)/);
  assert.match(header, /usesStackedHeaderLayout \? 'flex-col'/);
  assert.ok(existsSync(new URL('../public/uploads/temazcal.webp', import.meta.url)));
  assert.ok(existsSync(new URL('../public/uploads/Ciclo Femenino/Temazcal.jpeg', import.meta.url)));
});
