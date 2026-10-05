import type {
  NotificadorReservaConfirmada,
  ReservaConfirmadaParaNotificar,
} from '../../_application/reservas/ports.ts';

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const CUSTOM_FIELD_CHECKIN = 'Fecha_Checkin';
const CUSTOM_FIELD_CHECKOUT = 'Fecha_Checkout';

export class ManyChatNotificadorReserva implements NotificadorReservaConfirmada {
  private readonly apiKey: string;
  private readonly flowNs: string;
  private readonly fetcher: Fetcher;

  constructor(apiKey: string, flowNs: string, fetcher: Fetcher = fetch) {
    this.apiKey = apiKey;
    this.flowNs = flowNs;
    this.fetcher = fetcher;
  }

  async notificar(reserva: ReservaConfirmadaParaNotificar): Promise<void> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    await this.fetcher('https://api.manychat.com/fb/subscriber/setCustomFields', {
      method: 'POST', headers,
      body: JSON.stringify({
        subscriber_id: reserva.manyChatUserId,
        fields: [
          { field_name: CUSTOM_FIELD_CHECKIN, field_value: reserva.fechaCheckin },
          { field_name: CUSTOM_FIELD_CHECKOUT, field_value: reserva.fechaCheckout },
        ],
      }),
    });
    await this.fetcher('https://api.manychat.com/fb/sending/sendFlow', {
      method: 'POST', headers,
      body: JSON.stringify({ subscriber_id: reserva.manyChatUserId, flow_ns: this.flowNs }),
    });
  }
}

type Logger = (message: string) => void;

export function crearNotificadorManyChat(
  apiKey: string | undefined,
  flowNs: string | undefined,
  fetcher: Fetcher = fetch,
  logger: Logger = console.info
): NotificadorReservaConfirmada {
  if (typeof apiKey !== 'string' || apiKey.length === 0 ||
      typeof flowNs !== 'string' || flowNs.length === 0) {
    return {
      async notificar() {
        logger('manychat: notificación omitida porque la integración saliente está deshabilitada');
      },
    };
  }

  return new ManyChatNotificadorReserva(apiKey, flowNs, fetcher);
}
