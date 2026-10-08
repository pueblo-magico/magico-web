import type { EntregadorEventoIntegracion } from '../../_application/reservas/ports.ts';
import type { EventoOutboxIntegracion } from '../../_domain/reservas/integrationOutbox.ts';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class ErrorConfiguracionEntregaIntegracion extends Error {
  readonly codigo = 'INTEGRATION_DELIVERY_NOT_CONFIGURED';

  constructor() {
    super('La entrega de eventos no está configurada.');
    this.name = 'ErrorConfiguracionEntregaIntegracion';
  }
}

export class ErrorHttpEntregaIntegracion extends Error {
  readonly codigo: string;

  constructor(status: number) {
    super('El consumidor rechazó el evento.');
    this.name = 'ErrorHttpEntregaIntegracion';
    this.codigo = `INTEGRATION_HTTP_${status}`;
  }
}

export class HttpEntregadorEventosIntegracion implements EntregadorEventoIntegracion {
  private readonly url: string;
  private readonly secret: string;
  private readonly fetcher: Fetcher;

  constructor(configuracion: { url?: string; secret?: string }, fetcher?: Fetcher) {
    let url: URL;
    try {
      url = new URL(configuracion.url || '');
    } catch {
      throw new ErrorConfiguracionEntregaIntegracion();
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash ||
        !configuracion.secret || configuracion.secret.trim().length < 24) {
      throw new ErrorConfiguracionEntregaIntegracion();
    }
    this.url = url.toString();
    this.secret = configuracion.secret.trim();
    const fetchConfigurado = fetcher ?? globalThis.fetch.bind(globalThis);
    this.fetcher = (input, init) => fetchConfigurado(input, init);
  }

  async entregar(evento: EventoOutboxIntegracion): Promise<void> {
    const response = await this.fetcher(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secret}`,
        'Idempotency-Key': evento.eventId,
        'X-Event-Id': evento.eventId,
        'X-Event-Schema-Version': String(evento.schemaVersion),
      },
      body: JSON.stringify(evento.payload),
    });
    if (!response.ok) throw new ErrorHttpEntregaIntegracion(response.status);
  }
}
