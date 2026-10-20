export type EstadoEventoOutbox = 'pending' | 'processing' | 'delivered' | 'dead_letter';

export type EventoOutboxIntegracion = {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  estado: EstadoEventoOutbox;
  attempts: number;
  occurredAt: string;
  createdAt: string;
};

export type EventoOutboxOperativo = {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  estado: EstadoEventoOutbox;
  attempts: number;
  nextAttemptAt: string;
  lastErrorCode: string | null;
  occurredAt: string;
  createdAt: string;
  deliveredAt: string | null;
  ageSeconds: number;
  deliveryLatencySeconds: number | null;
};

export type EstadoOperativoOutbox = {
  resumen: Record<EstadoEventoOutbox, number>;
  oldestPendingAgeSeconds: number | null;
  deliveryLast24h: {
    attempts: number;
    failures: number;
    failureRate: number;
  };
  eventos: EventoOutboxOperativo[];
};

export function codigoErrorEntregaSeguro(error: unknown): string {
  const codigo = typeof error === 'object' && error !== null && 'codigo' in error
    ? String((error as { codigo?: unknown }).codigo || '')
    : '';
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) ? codigo : 'INTEGRATION_DELIVERY_ERROR';
}

export function proximoIntentoOutbox(
  attempts: number,
  ahora: Date,
  aleatorio: () => number = Math.random
): string {
  const intento = Math.max(1, Math.trunc(attempts));
  const baseSegundos = Math.min(60 * (2 ** (intento - 1)), 3600);
  const jitter = Math.floor(baseSegundos * 0.2 * Math.max(0, Math.min(1, aleatorio())));
  return new Date(ahora.getTime() + (baseSegundos + jitter) * 1000).toISOString();
}
