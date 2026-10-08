import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  COLIVING_PRICES,
  COLIVING_PRICES_USD,
  ESTADIA_PRICES,
  ESTADIA_PRICES_USD,
  RETREATS_DATA,
  formatPrice,
  getColivingPrices,
  getEstadiaPrices,
} from '../src/data/retreats.ts';

test('Spanish and English stay prices remain explicit, fixed price books', () => {
  assert.equal(getEstadiaPrices('es'), ESTADIA_PRICES);
  assert.equal(getEstadiaPrices('en'), ESTADIA_PRICES_USD);
  assert.deepEqual(ESTADIA_PRICES_USD, {
    carpaDesde: 15,
    ecoRefugioDesde: 25,
    domoPrivado: 35,
    domoPrivadoSolo: 70,
    almuerzo: 15,
    cena: 15,
    pensionCompletaCarpa: 30,
    pensionCompletaEcoRefugio: 40,
    pensionCompletaDomoPrivado: 50,
    resetVitalPresencial: 5,
  });
  assert.equal(formatPrice(20_000, 'es'), '$20.000');
  assert.equal(formatPrice(15, 'en'), 'USD 15');
});

test('Coliving and retreat prices include their confirmed USD equivalents', () => {
  assert.equal(getColivingPrices('es'), COLIVING_PRICES);
  assert.equal(getColivingPrices('en'), COLIVING_PRICES_USD);
  assert.deepEqual(
    COLIVING_PRICES_USD.formatos.map(({ precio }) => precio),
    [240, 280],
  );
  assert.equal(COLIVING_PRICES_USD.paseMensual.precio, 320);
  assert.deepEqual(RETREATS_DATA.familion.pricesUsd, {
    camping: 190,
    refugio: 300,
    domoPrivado: 430,
  });
  assert.equal(RETREATS_DATA.achalaViva.priceUsd, 120);
  assert.equal(RETREATS_DATA.gondorbows.priceUsd, 430);
  assert.deepEqual(RETREATS_DATA.cicloVitalFemenino.pricesUsd, {
    priceSola: 270,
    priceAcompanada: 200,
    senia: 70,
    segundoPago: 70,
    valorReferencia: 600,
  });
});

test('English content does not expose Argentine-peso price copy', async () => {
  const content = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8')).en;
  const strings = [];
  const collect = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(content);
  const joined = strings.join('\n');

  assert.doesNotMatch(joined, /\bARS\b|Argentine pesos/i);
  assert.doesNotMatch(joined, /\$\s?\d/);
  assert.match(content.hero.reservationPricing, /USD 15/);
  assert.match(content.reforestation.funding.phases[2].goal, /USD 10,000/);
});
