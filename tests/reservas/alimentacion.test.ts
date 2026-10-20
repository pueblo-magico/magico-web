import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cotizarAlimentacion,
  esRegimenAlimentacion,
} from '../../functions/_domain/reservas/alimentacion.ts';

test('el desayuno incluido no agrega importe a la estadía', () => {
  const resultado = cotizarAlimentacion(3, 4, {
    codigo: 'desayuno_incluido',
    version: 1,
    moneda: 'ARS',
    precioComidaCentavos: 2_000_000,
    comidasAdicionalesPorPersonaNoche: 0,
  });

  assert.equal(resultado.totalCentavos, 0);
  assert.equal(resultado.precioComidaCentavos, 2_000_000);
});

test('la pensión completa agrega dos comidas de ARS 20.000 por persona y noche', () => {
  const resultado = cotizarAlimentacion(2, 2, {
    codigo: 'pension_completa',
    version: 1,
    moneda: 'ARS',
    precioComidaCentavos: 2_000_000,
    comidasAdicionalesPorPersonaNoche: 2,
  });

  assert.equal(resultado.totalCentavos, 16_000_000);
  assert.equal(resultado.comidasAdicionalesPorPersonaNoche, 2);
});

test('la pensión completa usa precios por comida y un ajuste de paquete firmado', () => {
  const resultado = cotizarAlimentacion(2, 3, {
    codigo: 'pension_completa', version: 3, moneda: 'ARS',
    precioComidaCentavos: 0, comidasAdicionalesPorPersonaNoche: 2,
    precioDesayunoCentavos: 1_000_000,
    precioAlmuerzoCentavos: 2_000_000,
    precioCenaCentavos: 3_000_000,
    ajustePaqueteCentavos: -500_000,
  });
  assert.equal(resultado.totalCentavos, 27_000_000);
  assert.equal(resultado.ajustePaqueteCentavos, -500_000);
});

test('sólo reconoce los dos regímenes del contrato público', () => {
  assert.equal(esRegimenAlimentacion('desayuno_incluido'), true);
  assert.equal(esRegimenAlimentacion('pension_completa'), true);
  assert.equal(esRegimenAlimentacion('media_pension'), false);
});
