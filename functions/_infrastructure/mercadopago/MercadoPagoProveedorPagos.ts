import type {
  PagoExternoReserva,
  ProveedorPagosReserva,
} from '../../_application/reservas/ports.ts';
import { hashDni, normalizarDni } from '../../_lib/paymentIdentity.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class ErrorProveedorPagosTransitorio extends Error {}

export class MercadoPagoProveedorPagos implements ProveedorPagosReserva {
  private readonly accessToken: string;
  private readonly fetcher: Fetcher;
  private readonly reconciliationSecret: string;

  constructor(
    accessToken: string,
    reconciliationSecretOrFetcher: string | Fetcher = '',
    fetcher?: Fetcher
  ) {
    this.accessToken = accessToken;
    this.reconciliationSecret = typeof reconciliationSecretOrFetcher === 'string'
      ? reconciliationSecretOrFetcher
      : '';
    this.fetcher = typeof reconciliationSecretOrFetcher === 'function'
      ? reconciliationSecretOrFetcher
      : fetcher || ((input, init) => fetch(input, init));
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
      payer?: { identification?: { type?: unknown; number?: unknown } };
    };
    const monto = Number(pago.transaction_amount);
    const tipoDocumento = String(pago.payer?.identification?.type ?? '').toUpperCase();
    const dni = tipoDocumento === 'DNI'
      ? normalizarDni(pago.payer?.identification?.number)
      : null;
    const documentoHash = dni && this.reconciliationSecret.trim().length >= 32
      ? await hashDni(dni, this.reconciliationSecret)
      : null;
    return {
      id: String(pago.id ?? pagoId),
      estado: String(pago.status ?? ''),
      referenciaExterna: pago.external_reference,
      montoCentavos: Number.isFinite(monto) && monto >= 0 ? Math.round(monto * 100) : null,
      moneda: typeof pago.currency_id === 'string' ? pago.currency_id.toUpperCase() : null,
      pagadorDocumentoHash: documentoHash,
      pagadorDocumentoUltimos4: dni ? dni.slice(-4) : null,
    };
  }
}
