export type NivelObservabilidad = 'info' | 'warn' | 'error';

export type EventoOperativo = {
  event: string;
  operation: string;
  requestId: string;
  level: NivelObservabilidad;
  status?: number;
  durationMs?: number;
  reservationId?: string | number;
  eventId?: string;
  outcome?: string;
  metric?: string;
};

export type LoggerObservabilidad = {
  info?(evento: Record<string, unknown>): void;
  log?(evento: Record<string, unknown>): void;
  warn?(evento: Record<string, unknown>): void;
  error?(evento: Record<string, unknown>): void;
};

export type ContextoObservabilidad = {
  readonly requestId: string;
  readonly operation: string;
  setReservationId(id: string | number | null | undefined): void;
  setEventId(id: string | null | undefined): void;
  signal(event: string, level?: NivelObservabilidad, fields?: Pick<EventoOperativo, 'outcome' | 'metric'>): void;
};

const ID_SEGURO = /^[A-Za-z0-9._:-]{1,128}$/;

function idSeguro(valor: unknown): string | undefined {
  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0) return String(valor);
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.trim();
  return ID_SEGURO.test(limpio) ? limpio : undefined;
}

function emitir(logger: LoggerObservabilidad, evento: EventoOperativo): void {
  const payload: Record<string, unknown> = {
    service: 'reservas',
    event: evento.event,
    operation: evento.operation,
    request_id: evento.requestId,
    level: evento.level,
  };
  if (evento.status !== undefined) payload.status = evento.status;
  if (evento.durationMs !== undefined) payload.duration_ms = evento.durationMs;
  if (evento.reservationId !== undefined) payload.reservation_id = String(evento.reservationId);
  if (evento.eventId !== undefined) payload.event_id = evento.eventId;
  if (evento.outcome !== undefined) payload.outcome = evento.outcome;
  if (evento.metric !== undefined) payload.metric = evento.metric;

  const writer = evento.level === 'error'
    ? logger.error
    : evento.level === 'warn'
      ? logger.warn
      : (logger.info || logger.log);
  writer?.call(logger, payload);
}

export function obtenerRequestId(request: Request): string {
  return idSeguro(request.headers.get('X-Request-ID'))
    || idSeguro(request.headers.get('CF-Ray'))
    || crypto.randomUUID();
}

export async function observarSolicitud(
  request: Request,
  operation: string,
  handler: (contexto: ContextoObservabilidad) => Promise<Response>,
  logger: LoggerObservabilidad = console,
  now: () => number = Date.now
): Promise<Response> {
  const requestId = obtenerRequestId(request);
  const inicio = now();
  let reservationId: string | number | undefined;
  let eventId: string | undefined;
  const contexto: ContextoObservabilidad = {
    requestId,
    operation,
    setReservationId(id) { reservationId = idSeguro(id); },
    setEventId(id) { eventId = idSeguro(id); },
    signal(event, level = 'info', fields = {}) {
      emitir(logger, {
        event,
        operation,
        requestId,
        level,
        reservationId,
        eventId,
        ...fields,
      });
    },
  };

  try {
    const response = await handler(contexto);
    response.headers.set('X-Request-ID', requestId);
    const level: NivelObservabilidad = response.status >= 500
      ? 'error'
      : response.status >= 400
        ? 'warn'
        : 'info';
    emitir(logger, {
      event: 'http.request.completed',
      operation,
      requestId,
      level,
      status: response.status,
      durationMs: Math.max(0, now() - inicio),
      reservationId,
      eventId,
      outcome: response.ok ? 'success' : 'rejected',
      metric: 'reservas_http_requests_total',
    });
    return response;
  } catch (error) {
    emitir(logger, {
      event: 'http.request.failed',
      operation,
      requestId,
      level: 'error',
      status: 500,
      durationMs: Math.max(0, now() - inicio),
      reservationId,
      eventId,
      outcome: error instanceof Error ? 'exception' : 'unknown_exception',
      metric: 'reservas_http_errors_total',
    });
    throw error;
  }
}
