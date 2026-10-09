import type {
  ProveedorCheckoutReserva,
  SolicitudPreferenciaPago,
} from '../../_application/reservas/ports.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export class MercadoPagoCheckoutReservas implements ProveedorCheckoutReserva {
  private readonly accessToken: string;
  private readonly siteUrl: string;
  private readonly fetcher: Fetcher;

  constructor(accessToken: string, siteUrl: string, fetcher: Fetcher = (input, init) => fetch(input, init)) {
    this.accessToken = accessToken;
    this.siteUrl = siteUrl.replace(/\/$/, '');
    this.fetcher = fetcher;
  }

  async buscarPreferenciaPorReferencia(referencia: string | number): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  } | null> {
    const query = new URLSearchParams({ external_reference: String(referencia) });
    const response = await this.fetcher(
      `https://api.mercadopago.com/checkout/preferences/search?${query}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    if (!response.ok) throw new Error('Mercado Pago no pudo buscar la preferencia.');
    const data = await response.json() as {
      results?: Array<{ id?: unknown; init_point?: unknown; external_reference?: unknown }>;
    };
    const encontrada = data.results?.find(item =>
      String(item.external_reference ?? '') === String(referencia) && item.id
    );
    return encontrada ? {
      preferenciaId: String(encontrada.id),
      checkoutUrl: typeof encontrada.init_point === 'string' ? encontrada.init_point : null,
    } : null;
  }

  async crearPreferencia(solicitud: SolicitudPreferenciaPago): Promise<{
    preferenciaId: string;
    checkoutUrl: string | null;
  }> {
    const referenciaRetorno = encodeURIComponent(solicitud.reservaCodigo || String(solicitud.reservaId));
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
        external_reference: solicitud.reservaCodigo || String(solicitud.reservaId),
        notification_url: `${this.siteUrl}/api/webhook-mp`,
        back_urls: {
          success: `${this.siteUrl}/reserva-confirmada?reserva=${referenciaRetorno}`,
          pending: `${this.siteUrl}/reserva-pendiente?reserva=${referenciaRetorno}`,
          failure: `${this.siteUrl}/reserva-fallida?reserva=${referenciaRetorno}`,
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
