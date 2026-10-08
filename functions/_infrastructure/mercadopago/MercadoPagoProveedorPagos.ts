import type {
  PagoExternoReserva,
  ProveedorPagosReserva,
} from '../../_application/reservas/ports.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class ErrorProveedorPagosTransitorio extends Error {}

export class MercadoPagoProveedorPagos implements ProveedorPagosReserva {
  private readonly accessToken: string;
  private readonly fetcher: Fetcher;

  constructor(accessToken: string, fetcher: Fetcher = (input, init) => fetch(input, init)) {
    this.accessToken = accessToken;
    this.fetcher = fetcher;
  }

  async obtenerPago(pagoId: string): Promise<PagoExternoReserva | null> {
    let response: Response;
    try {
      response = await this.fetcher(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } catch (cause) {
      throw new ErrorProveedorPagosTransitorio('No se pudo consultar Mercado Pago.', { cause });
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new ErrorProveedorPagosTransitorio(`Mercado Pago respondió ${response.status}.`);

    const pago = await response.json() as {
      id?: unknown;
      status?: unknown;
      external_reference?: unknown;
      transaction_amount?: unknown;
      currency_id?: unknown;
    };
    const monto = Number(pago.transaction_amount);
    return {
      id: String(pago.id ?? pagoId),
      estado: String(pago.status ?? ''),
      referenciaExterna: pago.external_reference,
      montoCentavos: Number.isFinite(monto) && monto >= 0 ? Math.round(monto * 100) : null,
      moneda: typeof pago.currency_id === 'string' ? pago.currency_id.toUpperCase() : null,
    };
  }
}
