import type {
  PagoExternoReserva,
  ProveedorPagosReserva,
} from '../../_application/reservas/ports.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class MercadoPagoProveedorPagos implements ProveedorPagosReserva {
  private readonly accessToken: string;
  private readonly fetcher: Fetcher;

  constructor(accessToken: string, fetcher: Fetcher = fetch) {
    this.accessToken = accessToken;
    this.fetcher = fetcher;
  }

  async obtenerPago(pagoId: string): Promise<PagoExternoReserva | null> {
    const response = await this.fetcher(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!response.ok) return null;

    const pago = await response.json() as { id?: unknown; status?: unknown; external_reference?: unknown };
    return {
      id: String(pago.id ?? pagoId),
      estado: String(pago.status ?? ''),
      referenciaExterna: pago.external_reference,
    };
  }
}
