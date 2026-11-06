import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/PresupuestoRetiro.tsx', import.meta.url), 'utf8');
const routes = readFileSync(new URL('../src/routes.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/OrganizaTuRetiro.tsx', import.meta.url), 'utf8');

test('both supplied personalized retreat proposals are present', () => {
  assert.match(page, /cande:[\s\S]*name: 'Cande'[\s\S]*Febrero 2027[\s\S]*15 a 20 personas/);
  assert.match(page, /'barbi-firmapaz':[\s\S]*name: 'Barbi Firmapaz'[\s\S]*Marzo 2027[\s\S]*15 a 30 personas/);
  assert.match(page, /2 noches \/ 3 días/);
  assert.match(page, /300000/);
});

test('proposal validity starts tomorrow and lasts exactly 30 days', () => {
  assert.match(page, /PROPOSAL_VALID_FROM = '2026-11-07T00:00:00-03:00'/);
  assert.match(page, /PROPOSAL_VALID_UNTIL = '2026-12-07T00:00:00-03:00'/);
  assert.equal(
    new Date('2026-12-07T00:00:00-03:00').getTime() - new Date('2026-11-07T00:00:00-03:00').getTime(),
    30 * 24 * 60 * 60 * 1000,
  );
  assert.match(page, /Propuesta válida por 30 días/);
  assert.match(page, /VALIDITY_LABEL/);
  assert.match(page, /remaining\.seconds/);
});

test('private proposal route is wired and the public retreat CTA requests a quote', () => {
  assert.match(routes, /PRESUPUESTO_RETIRO: '\/presupuestos\/:proposalId'/);
  assert.match(app, /ROUTES\.PRESUPUESTO_RETIRO/);
  assert.match(source, /Pedir un presupuesto/);
  assert.match(source, /Quiero pedir un presupuesto/);
});

test('proposal reflects the supplied all-inclusive scope', () => {
  for (const expected of [
    '2 desayunos',
    '2 almuerzos',
    '2 cenas',
    'Brunch permanente',
    'Ropa blanca, toallas y biocosmética',
    'Seguro de responsabilidad civil y accidentes personales',
    'Ceremonia de Temazcal',
  ]) {
    assert.ok(page.includes(expected), `missing proposal content: ${expected}`);
  }
});
