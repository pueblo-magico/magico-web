import test from 'node:test';
import assert from 'node:assert/strict';

import { selectLowestPerPersonRates } from '../src/data/reservasRatePresentation.ts';

const rule = (base_calculo, importe_centavos, ocupacion_min, ocupacion_max) => ({
  temporada_codigo: 'base',
  fecha_desde: '2026-01-01',
  fecha_hasta: '2027-12-31',
  dias_semana: [1, 2, 3, 4, 5, 6, 7],
  modalidad: 'cualquiera',
  ocupacion_min,
  ocupacion_max,
  base_calculo,
  importe_centavos,
});

test('resume el plan en una sola tarifa desde por alojamiento y por persona/noche', () => {
  const rows = selectLowestPerPersonRates({
    fecha_referencia: '2026-11-06',
    plan: { codigo: 'alojamiento-base', version: 3, moneda: 'ARS' },
    alimentacion: { pension_completa: null },
    opciones: [{
      tipo_alojamiento: 'domo',
      tarifas: [
        rule('unidad_noche', 15_000_000, 1, 1),
        rule('unidad_noche', 7_500_000, 2, 2),
        rule('persona_noche', 6_500_000, 3, 5),
        rule('persona_noche', 5_000_000, 6, 7),
      ],
    }, {
      tipo_alojamiento: 'refugio',
      tarifas: [rule('persona_noche', 3_500_000, 1, 15)],
    }, {
      tipo_alojamiento: 'camping',
      tarifas: [rule('persona_noche', 2_000_000, 1, 100)],
    }],
  });

  assert.deepEqual(rows, [
    { tipo: 'domo', importeCentavos: 5_000_000 },
    { tipo: 'refugio', importeCentavos: 3_500_000 },
    { tipo: 'camping', importeCentavos: 2_000_000 },
  ]);
});

test('omite alojamientos sin tarifa por persona para no inferir un precio comercial', () => {
  const rows = selectLowestPerPersonRates({
    fecha_referencia: '2026-11-06',
    plan: { codigo: 'alojamiento-base', version: 3, moneda: 'ARS' },
    alimentacion: { pension_completa: null },
    opciones: [{
      tipo_alojamiento: 'domo',
      tarifas: [rule('unidad_noche', 7_500_000, 2, 2)],
    }],
  });

  assert.deepEqual(rows, []);
});
