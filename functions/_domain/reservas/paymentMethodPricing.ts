export type MetodoPagoReserva = 'mercado_pago_checkout' | 'transferencia_mp';

export const MERCADO_PAGO_CHECKOUT_SURCHARGE_BPS = 1_000;

export type PrecioMetodoPago = {
  porcentajeBps: number;
  recargoTotalCentavos: number;
  recargoSenaCentavos: number;
  totalCentavos: number;
  senaCentavos: number;
  saldoCentavos: number;
};

export function porcentajeRecargoMetodoPago(metodo: MetodoPagoReserva): number {
  return metodo === 'mercado_pago_checkout' ? MERCADO_PAGO_CHECKOUT_SURCHARGE_BPS : 0;
}

export function calcularPrecioMetodoPago(
  totalBaseCentavos: number,
  senaBaseCentavos: number,
  metodo: MetodoPagoReserva
): PrecioMetodoPago {
  const porcentajeBps = porcentajeRecargoMetodoPago(metodo);
  const recargoTotalCentavos = Math.round(totalBaseCentavos * porcentajeBps / 10_000);
  const recargoSenaCentavos = Math.round(senaBaseCentavos * porcentajeBps / 10_000);
  const totalCentavos = totalBaseCentavos + recargoTotalCentavos;
  const senaCentavos = senaBaseCentavos + recargoSenaCentavos;
  return {
    porcentajeBps,
    recargoTotalCentavos,
    recargoSenaCentavos,
    totalCentavos,
    senaCentavos,
    saldoCentavos: totalCentavos - senaCentavos,
  };
}
