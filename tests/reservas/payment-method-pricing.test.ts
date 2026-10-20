import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calcularPrecioMetodoPago,
  MERCADO_PAGO_CHECKOUT_SURCHARGE_BPS,
} from '../../functions/_domain/reservas/paymentMethodPricing.ts';

test('Mercado Pago suma 10% al total y distribuye el recargo entre seña y saldo', () => {
  const precio = calcularPrecioMetodoPago(20_000_000, 6_000_000, 'mercado_pago_checkout');
  assert.deepEqual(precio, {
    porcentajeBps: MERCADO_PAGO_CHECKOUT_SURCHARGE_BPS,
    recargoTotalCentavos: 2_000_000,
    recargoSenaCentavos: 600_000,
    totalCentavos: 22_000_000,
    senaCentavos: 6_600_000,
    saldoCentavos: 15_400_000,
  });
});

test('la transferencia conserva los importes cotizados sin recargo', () => {
  assert.deepEqual(calcularPrecioMetodoPago(20_000_000, 6_000_000, 'transferencia_mp'), {
    porcentajeBps: 0,
    recargoTotalCentavos: 0,
    recargoSenaCentavos: 0,
    totalCentavos: 20_000_000,
    senaCentavos: 6_000_000,
    saldoCentavos: 14_000_000,
  });
});
