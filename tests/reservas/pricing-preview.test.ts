import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateBookingPrice, stayNightDates } from '../../components/booking/pricingPreview.ts';
import type {
  AccommodationType,
  BookingMode,
  PublicPriceRule,
  PublicPricingSummary,
} from '../../components/booking/bookingApi.ts';

function rule(amount: number, base: PublicPriceRule['base_calculo'] = 'unidad_noche'): PublicPriceRule {
  return {
    temporada_codigo: 'base', fecha_desde: '2027-01-01', fecha_hasta: '2027-12-31',
    prioridad: 0, dias_semana: [1, 2, 3, 4, 5, 6, 7], modalidad: 'cualquiera',
    ocupacion_min: 1, ocupacion_max: 10, base_calculo: base, importe_centavos: amount,
  };
}

function summary(
  date: string,
  options: Array<{ type: AccommodationType; modes: BookingMode[]; rates: PublicPriceRule[] }>,
): PublicPricingSummary {
  return {
    fecha_referencia: date,
    plan: { codigo: 'published', version: 4, moneda: 'ARS' },
    horarios_comidas: {
      version: 1,
      desayuno: { desde: '09:00', hasta: '10:00' },
      almuerzo: { desde: '14:00', hasta: '15:00' },
      cena: { desde: '20:00', hasta: '21:00' },
    },
    alimentacion: {
      desayuno_incluido: { version: 1, precio_comida_centavos: 0, comidas_adicionales_por_persona_noche: 0 },
      pension_completa: {
        version: 2, precio_comida_centavos: 2_000, comidas_adicionales_por_persona_noche: 2,
        adicional_por_persona_noche_centavos: 4_000,
      },
    },
    opciones: options.map(option => ({
      tipo_alojamiento: option.type, modalidades: option.modes,
      capacidad_comercial: 10, tarifas: option.rates,
    })),
  };
}

test('enumera las noches con checkout exclusivo', () => {
  assert.deepEqual(stayNightDates('2027-10-08', '2027-10-11'), [
    '2027-10-08', '2027-10-09', '2027-10-10',
  ]);
  assert.deepEqual(stayNightDates('2027-10-11', '2027-10-11'), []);
});

test('muestra el menor total estable para todas las noches y el precio por persona', () => {
  const weekdays = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(90_000)] },
    { type: 'camping', modes: ['camping'], rates: [rule(20_000, 'persona_noche')] },
  ]);
  const weekend = summary('2027-10-09', [
    { type: 'domo', modes: ['compartida'], rates: [rule(120_000)] },
    { type: 'camping', modes: ['camping'], rates: [rule(30_000, 'persona_noche')] },
  ]);

  assert.deepEqual(estimateBookingPrice([weekdays, weekend], { people: 2 }), {
    currency: 'ARS', totalCentavos: 100_000, perPersonCentavos: 50_000,
    type: 'camping', mode: 'camping',
  });
});

test('calcula la selección actual con suplemento de pensión completa', () => {
  const first = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(90_000)] },
  ]);
  const second = summary('2027-10-09', [
    { type: 'domo', modes: ['compartida'], rates: [rule(120_000)] },
  ]);

  assert.deepEqual(estimateBookingPrice([first, second], {
    people: 2, type: 'domo', mode: 'compartida', mealPlan: 'pension_completa',
  }), {
    currency: 'ARS', totalCentavos: 226_000, perPersonCentavos: 113_000,
    type: 'domo', mode: 'compartida',
  });
});

test('aplica los ajustes comerciales al total mostrado en la vista previa', () => {
  const first = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
  ]);
  first.ajustes = [{
    codigo: 'venta-anticipada', nombre: 'Venta anticipada', anticipacion_desde_dias: 0,
    anticipacion_hasta_dias: null, direccion: 'descuento', tipo: 'porcentaje_bps', valor: 1000,
  }];
  const second = summary('2027-10-09', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
  ]);

  assert.deepEqual(estimateBookingPrice([first, second], {
    people: 2, type: 'domo', mode: 'compartida',
  }), {
    currency: 'ARS', totalCentavos: 180_000, perPersonCentavos: 90_000,
    type: 'domo', mode: 'compartida',
  });
});

test('rechaza una vista previa inconsistente o sin una opción vendible', () => {
  const first = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
  ]);
  const second = summary('2027-10-09', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
  ]);
  second.plan.moneda = 'USD';
  assert.equal(estimateBookingPrice([first, second], {
    people: 2, type: 'domo', mode: 'compartida',
  }), null);

  first.opciones[0].capacidad_comercial = 1;
  assert.equal(estimateBookingPrice([first], {
    people: 2, type: 'domo', mode: 'compartida',
  }), null);
  assert.equal(estimateBookingPrice([first], { people: 0 }), null);
  assert.equal(estimateBookingPrice([first], { people: 1, type: 'camping' }), null);
});

test('aplica un importe fijo una sola vez y nunca deja un total negativo', () => {
  const first = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
  ]);
  first.ajustes = [{
    codigo: 'bonificacion', nombre: 'Bonificación', anticipacion_desde_dias: 0,
    anticipacion_hasta_dias: null, direccion: 'descuento', tipo: 'importe_fijo', valor: 200_000,
  }];
  assert.equal(estimateBookingPrice([first], {
    people: 1, type: 'domo', mode: 'compartida',
  })?.totalCentavos, 0);
});

test('no mezcla alojamientos por noche para fabricar un mínimo imposible', () => {
  const first = summary('2027-10-08', [
    { type: 'domo', modes: ['compartida'], rates: [rule(10_000)] },
    { type: 'camping', modes: ['camping'], rates: [rule(100_000)] },
  ]);
  const second = summary('2027-10-09', [
    { type: 'domo', modes: ['compartida'], rates: [rule(100_000)] },
    { type: 'camping', modes: ['camping'], rates: [rule(10_000)] },
  ]);

  assert.equal(estimateBookingPrice([first, second], { people: 1 })?.totalCentavos, 110_000);
});
