import type {
  ProveedorCheckoutReserva,
  SolicitudPreferenciaPago,
} from '../../_application/reservas/ports.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class MercadoPagoCheckoutReservas implements ProveedorCheckoutReserva {
  private readonly accessToken: string;
  private readonly siteUrl: string;
  private readonly fetcher: Fetcher;

  constructor(accessToken: string, siteUrl: string, fetcher: Fetcher = fetch) {
    this.accessToken = accessToken;
    this.siteUrl = siteUrl;
    this.fetcher = fetcher;
  }

  async crearPreferencia(solicitud: SolicitudPreferenciaPago): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  }> {
    const response = await this.fetcher('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: `Seña — ${solicitud.tipoAlojamiento === 'domo' ? 'Domo' : 'Refugio Compartido'}, Pueblo Mágico`,
          quantity: 1,
          unit_price: solicitud.montoSena,
          currency_id: 'ARS',
        }],
        external_reference: String(solicitud.reservaId),
        notification_url: `${this.siteUrl}/api/webhook-mp`,
        back_urls: {
          success: `${this.siteUrl}/reserva-confirmada`,
          pending: `${this.siteUrl}/reserva-pendiente`,
          failure: `${this.siteUrl}/reserva-fallida`,
        },
        auto_return: 'approved',
      }),
    });
    const data = await response.json() as { id?: unknown; init_point?: unknown };

    if (!response.ok || !data.id) {
      throw new Error('Mercado Pago no pudo crear la preferencia.');
    }

    return {
      preferenciaId: String(data.id),
      checkoutUrl: typeof data.init_point === 'string' ? data.init_point : null,
    };
  }
}
