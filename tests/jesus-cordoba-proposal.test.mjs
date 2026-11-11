import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PRIVATE_PROPOSALS } from '../scripts/private-proposal.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Jesús Córdoba proposal is wired into the private presupuestos tree', () => {
  const routes = read('src/routes.ts');
  const entry = read('index.tsx');
  const checks = read('scripts/check-routes.mjs');
  const proposal = PRIVATE_PROPOSALS.find(item => item.path === '/presupuestos/jesus-cordoba');

  assert.ok(proposal);
  assert.match(proposal.title, /Jesús Córdoba/);
  assert.match(routes, /PRESUPUESTO_JESUS_CORDOBA: '\/presupuestos\/jesus-cordoba'/);
  assert.match(entry, /PropuestaJesusCordoba/);
  assert.match(entry, /ROUTES\.PRESUPUESTO_JESUS_CORDOBA/);
  assert.ok(checks.includes("'/presupuestos/jesus-cordoba'"));
});

test('proposal preserves the confirmed commercial and operational scope', () => {
  const page = read('src/PropuestaJesusCordoba.tsx');

  for (const expected of [
    '12 y 16 participantes',
    'hasta 6 personas',
    'dos anfitriones adicionales',
    '600 kg de hielo',
    '20 × 20 metros',
    '$13.800.000',
    '$17.500.000',
    'Finde de carnaval 2027 · 6 al 9 de febrero',
    'Temazcal para todos los participantes y equipo facilitador',
    '/uploads/propuestas/jesus-cordoba-gastronomia-v2.webp',
    '/uploads/propuestas/jesus-cordoba-firewalk-v2.webp',
    '/uploads/propuestas/jesus-cordoba-retrato.webp',
    'https://www.instagram.com/jesuscordoba.oficial/',
    'Facilitadores principales',
    'Preparación anticipada',
    'condiciones de reserva, pagos y vigencia de la propuesta: a confirmar',
  ]) assert.match(page, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

  assert.match(page, /usePrivateProposalMeta\(/);
  assert.doesNotMatch(page, /\$12\.500\.000|\$16\.500\.000|\/uploads\/arcos-fuego\.jpg/);
  assert.doesNotMatch(page, /precio de venta|margen comercial/i);
});
