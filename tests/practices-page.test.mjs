import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('practices page is routable, prerendered and discoverable', () => {
  const routes = read('src/routes.ts');
  const entry = read('index.tsx');
  const prerender = read('scripts/prerender.mjs');
  const sitemap = read('public/sitemap.xml');
  const smokeRoutes = read('scripts/check-routes.mjs');

  assert.match(routes, /PRACTICAS:\s*'\/practicas'/);
  assert.match(entry, /import\('\.\/src\/Practicas'\)/);
  assert.match(entry, /path=\{ROUTES\.PRACTICAS\}/);
  assert.match(prerender, /path:\s*'\/practicas'/);
  assert.match(prerender, /canonical:\s*'https:\/\/experienciamagico\.com\/practicas'/);
  assert.match(sitemap, /<loc>https:\/\/experienciamagico\.com\/practicas<\/loc>/);
  assert.match(smokeRoutes, /'\/practicas'/);
});

test('page communicates the strategy and every confirmed practice', () => {
  const page = read('src/Practicas.tsx');

  for (const text of [
    'Quiénes somos',
    'Qué hacemos',
    'Para qué',
    'Cómo',
    'Temazcal',
    'Uso ceremonial de rapé',
    'Música como medicina',
    'Círculos de palabra',
    'Fuego ceremonial',
    'Uso ceremonial de tabaco',
  ]) assert.ok(page.includes(text), `Missing practices copy: ${text}`);

  assert.match(page, /invitaciones abiertas/i);
  assert.match(page, /No son tratamientos médicos ni una invitación al consumo libre/);
  assert.match(page, /participación es siempre voluntaria/);
});

test('pillars introduce practices and Consciousness links to the page', () => {
  const pillars = read('components/SectionPilares.tsx');

  assert.match(pillars, /pillar\.id === 4[\s\S]*ROUTES\.PRACTICAS/);
  assert.match(pillars, /href=\{ROUTES\.PRACTICAS\}/);
  assert.match(pillars, /Prácticas que sostienen nuestra visión/);
  assert.match(pillars, /Practices that sustain our vision/);
});

test('practices page uses existing Pueblo Mágico photography', () => {
  for (const asset of [
    'public/uploads/temazcal.webp',
    'public/uploads/Ciclo Femenino/Temazcal.jpeg',
    'public/uploads/sunset-rio-fogon-real.webp',
  ]) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `Missing asset: ${asset}`);
});
