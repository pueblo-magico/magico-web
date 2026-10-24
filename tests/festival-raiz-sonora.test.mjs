import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dataSource = await readFile(new URL('../src/data/festivalOctubre.ts', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../src/FestivalOctubre.tsx', import.meta.url), 'utf8');

test('prioritizes the overnight festival experience over the day pass', () => {
  const campingIndex = dataSource.indexOf("id: 'camping-una-noche'");
  const dayPassIndex = dataSource.indexOf("id: 'pase-por-el-dia'");

  assert.ok(campingIndex >= 0, 'one-night camping option is present');
  assert.ok(dayPassIndex > campingIndex, 'day pass appears after overnight options');
  assert.match(dataSource.slice(campingIndex, dayPassIndex), /featured: true/);
  assert.match(pageSource, /Elegir mi estadía/);
});

test('communicates cash and card totals without an interest-free claim', () => {
  assert.doesNotMatch(`${dataSource}\n${pageSource}`, /sin interés/i);
  assert.match(dataSource, /cardTotal: 'AR\$ 78\.000'/);
  assert.match(dataSource, /installmentAmount: 'AR\$ 26\.000'/);
  assert.match(pageSource, /Tarjeta: \{option\.cardTotal\} total/);
});

test('publishes the confirmed four-act schedule', () => {
  for (const expected of [
    "time: '14:00–16:00', name: 'Stefanotherock'",
    "time: '16:00–18:00', name: 'Fede W Salas'",
    "time: '18:00–20:00', name: 'Mationix'",
    "time: '20:00–22:00', name: 'Maurión'",
  ]) {
    assert.ok(pageSource.includes(expected), `schedule contains ${expected}`);
  }
});

test('keeps practical purchase information visible before the FAQ', () => {
  assert.match(pageSource, /Todos los accesos incluyen/);
  assert.match(pageSource, /Se reserva por separado/);
  assert.match(pageSource, /Abrir Google Maps/);
  assert.match(pageSource, /Consultar viaje compartido/);
  assert.doesNotMatch(pageSource, /camping, habitación o Domo/);
  assert.doesNotMatch(`${dataSource}\n${pageSource}`, /estacionamiento|parking/i);
});

test('makes the bad-weather policy explicit', () => {
  assert.match(pageSource, /Raíz Sonora no se suspende por mal tiempo\./);
});

test('publishes only the confirmed public promotions and family conditions', () => {
  assert.match(pageSource, /GROUP_PROMOTION_END = new Date\('2026-10-26T00:00:00-03:00'\)/);
  assert.match(pageSource, /Promo Grupos · hasta el 25\/10 inclusive/);
  assert.match(pageSource, /La promoción termina en/);
  assert.match(pageSource, /Promo Grupos · finalizada/);
  assert.match(pageSource, /Vengan 4 o más y reciban 50% OFF/);
  assert.match(pageSource, /Niñas y niños de 0 a 12 entran gratis/);
  assert.match(pageSource, /Tu entrada también regenera/);
  assert.match(pageSource, /El 10% de lo recaudado por Raíz Sonora/);
  assert.match(pageSource, /href="\/reforestacion"/);
  assert.match(dataSource, /Reservas online hasta el 30\/10\/2026 a las 18:00/);
  assert.doesNotMatch(`${dataSource}\n${pageSource}`, /50% off para una persona/i);
  assert.doesNotMatch(`${dataSource}\n${pageSource}`, /máximo 10/i);
});
