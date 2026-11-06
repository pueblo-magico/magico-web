import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEGACY_PRIVATE_PROPOSAL_PATHS,
  PRIVATE_PROPOSALS,
  privateProposalShell,
} from '../scripts/private-proposal.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('every personalized budget gets a private HTML shell without public SEO', () => {
  const template = read('index.html');

  for (const proposal of PRIVATE_PROPOSALS) {
    const html = privateProposalShell(template, proposal.title);
    assert.ok(html.includes(`<title>${proposal.title}</title>`));
    assert.match(html, /name="robots" content="noindex, nofollow, noarchive, nosnippet"/);
    assert.match(html, /name="googlebot" content="noindex, nofollow, noarchive, nosnippet"/);
    assert.match(html, /name="referrer" content="no-referrer"/);
    assert.doesNotMatch(html, /rel="canonical"|property="og:|name="description"|name="twitter:|application\/ld\+json/);
    assert.match(html, /id="root"/);
    assert.match(html, /index\.tsx/);
  }
});

test('new and legacy paths receive server-side privacy headers', () => {
  const headers = read('public/_headers');
  assert.ok(headers.includes('/presupuesto/*\n  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet'));
  assert.ok(headers.includes('/presupuestos/*\n  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet'));

  for (const legacyPath of LEGACY_PRIVATE_PROPOSAL_PATHS) {
    assert.ok(headers.includes(`${legacyPath}*\n  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`));
  }
});

test('legacy proposal URLs permanently redirect into the presupuesto tree', () => {
  const redirects = read('public/_redirects');
  const expectedRedirects = new Map([
    ['/aulas-verdes-360-travel', '/presupuesto/aulas-verdes-360-travel'],
    ['/aulas-verdes-travel-360', '/presupuesto/aulas-verdes-360-travel'],
    ['/aulas-verdes-729-salvador-mazza', '/presupuesto/aulas-verdes-729-salvador-mazza'],
    ['/propuesta/calma-magico', '/presupuesto/calma-magico'],
    ['/propuesta/nico-grupe', '/presupuesto/nico-grupe'],
  ]);

  for (const [from, to] of expectedRedirects) {
    assert.ok(redirects.includes(`${from}    ${to}    301`));
  }
  assert.doesNotMatch(redirects, /\/propuesta\/nico-grupe\s+\/app-shell\/\s+200/);
});

test('personalized budgets stay outside public discovery and analytics', () => {
  const discoveryFiles = ['public/sitemap.xml', 'components/Header.tsx', 'components/Footer.tsx'];
  for (const proposal of PRIVATE_PROPOSALS) {
    for (const file of discoveryFiles) assert.ok(!read(file).includes(proposal.path));
  }

  const entry = read('index.tsx');
  assert.match(entry, /'\/presupuesto\/'/);
  assert.match(entry, /ROUTES\.PRESUPUESTO_RETIRO/);
  for (const legacyPath of LEGACY_PRIVATE_PROPOSAL_PATHS) assert.ok(entry.includes(legacyPath));

  const prerender = read('scripts/prerender.mjs');
  assert.doesNotMatch(prerender, /canonical:\s*['"]https:\/\/experienciamagico\.com\/propuesta\/calma-magico/);
  assert.match(prerender, /for \(const proposal of PRIVATE_PROPOSALS\)/);
});

test('all proposal components apply private metadata during client navigation', () => {
  for (const file of [
    'src/AulaVerdeTravel360.tsx',
    'src/AulaVerdeSalvadorMazza.tsx',
    'src/PropuestaCalmaYoga.tsx',
    'src/PropuestaNicoGrupe.tsx',
    'src/PresupuestoRetiro.tsx',
  ]) {
    assert.match(read(file), /usePrivateProposalMeta\(/);
  }
});
