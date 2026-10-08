export type TipoIntencionComunicacion =
  | 'reserva_creada'
  | 'pago_pendiente'
  | 'pago_aprobado'
  | 'reserva_vencida'
  | 'reserva_modificada'
  | 'reserva_cancelada';

export type EstadoIntencionComunicacion =
  | 'pendiente'
  | 'procesando'
  | 'entregada'
  | 'sin_canal'
  | 'dead_letter';

export type IntencionComunicacion = {
  intencionUid: string;
  reservaId: number;
  tipo: TipoIntencionComunicacion;
  idioma: 'es' | 'en';
  plantillaCodigo: string;
  plantillaVersion: number;
  estado: EstadoIntencionComunicacion;
  attempts: number;
  createdAt: string;
};

export type IntencionComunicacionOperativa = {
  intencionUid: string;
  reservaId: number;
  tipo: TipoIntencionComunicacion;
  idioma: 'es' | 'en';
  estado: EstadoIntencionComunicacion;
  attempts: number;
  canal: string | null;
  nextAttemptAt: string;
  lastErrorCode: string | null;
  createdAt: string;
  deliveredAt: string | null;
  ageSeconds: number;
};

export type EstadoOperativoComunicaciones = {
  resumen: Record<EstadoIntencionComunicacion, number>;
  oldestPendingAgeSeconds: number | null;
  deliveryLast24h: {
    attempts: number;
    failures: number;
    failureRate: number;
  };
  intenciones: IntencionComunicacionOperativa[];
};

export function codigoErrorComunicacionSeguro(error: unknown): string {
  const codigo = typeof error === 'object' && error !== null && 'codigo' in error
    ? String((error as { codigo?: unknown }).codigo || '')
    : '';
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo)
    ? codigo
    : 'COMMUNICATION_DELIVERY_ERROR';
}

export function proximoIntentoComunicacion(
  attempts: number,
  ahora: Date,
  aleatorio: () => number = Math.random
): string {
  const intento = Math.max(1, Math.trunc(attempts));
  const baseSegundos = Math.min(60 * (2 ** (intento - 1)), 3600);
  const jitter = Math.floor(baseSegundos * 0.2 * Math.max(0, Math.min(1, aleatorio())));
  return new Date(ahora.getTime() + (baseSegundos + jitter) * 1000).toISOString();
}
