import type { EstadoOperativoComunicaciones } from './communicationIntents.ts';
import type { EstadoOperativoOutbox } from './integrationOutbox.ts';

export type NivelAlertaOperativa = 'info' | 'warning' | 'critical';

export type EventoPagoOperativo = {
  proveedor: string;
  reservaId: number | null;
  resultado: string;
  motivoCodigo: string | null;
  correlationId: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type EstadoOperativoMvp = {
  reservas: {
    pendientesPago: number;
    retencionesVencidasSinProcesar: number;
    oldestPendingAgeSeconds: number | null;
  };
  pagos: {
    webhooksLast24h: number;
    aplicadosLast24h: number;
    inconsistentesLast24h: number;
    eventos: EventoPagoOperativo[];
  };
  outbox: EstadoOperativoOutbox;
  comunicaciones: EstadoOperativoComunicaciones;
  tendenciaColas: {
    outbox: TendenciaColaOperativa;
    comunicaciones: TendenciaColaOperativa;
  };
  alertas: Array<{
    codigo: string;
    nivel: NivelAlertaOperativa;
    mensaje: string;
    cantidad: number;
  }>;
};

export type TendenciaColaOperativa = {
  creadosPendientesUltimos15m: number;
  creadosPendientes15mAnteriores: number;
  crecimiento: number;
};

export function construirAlertasOperativas(
  estado: Omit<EstadoOperativoMvp, 'alertas'>
): EstadoOperativoMvp['alertas'] {
  const alertas: EstadoOperativoMvp['alertas'] = [];
  if (estado.reservas.retencionesVencidasSinProcesar > 0) alertas.push({
    codigo: 'RETENCIONES_VENCIDAS', nivel: 'critical',
    mensaje: 'Hay retenciones vencidas que todavía bloquean inventario.',
    cantidad: estado.reservas.retencionesVencidasSinProcesar,
  });
  if ((estado.outbox.oldestPendingAgeSeconds || 0) >= 900) alertas.push({
    codigo: 'OUTBOX_ANTIGUO', nivel: 'warning',
    mensaje: 'La entrega externa tiene pendientes de más de 15 minutos.',
    cantidad: estado.outbox.resumen.pending + estado.outbox.resumen.processing,
  });
  if (estado.outbox.resumen.dead_letter > 0) alertas.push({
    codigo: 'OUTBOX_DEAD_LETTER', nivel: 'critical',
    mensaje: 'Hay eventos externos que requieren revisión y reproceso manual.',
    cantidad: estado.outbox.resumen.dead_letter,
  });
  const comunicacionesFallidas = estado.comunicaciones.resumen.dead_letter +
    estado.comunicaciones.resumen.sin_canal;
  if (comunicacionesFallidas > 0) alertas.push({
    codigo: 'COMUNICACIONES_PENDIENTES', nivel: 'warning',
    mensaje: 'Hay comunicaciones sin canal o con entrega agotada.',
    cantidad: comunicacionesFallidas,
  });
  if (estado.pagos.inconsistentesLast24h > 0) alertas.push({
    codigo: 'PAGOS_INCONSISTENTES', nivel: 'critical',
    mensaje: 'Mercado Pago informó eventos que requieren conciliación manual.',
    cantidad: estado.pagos.inconsistentesLast24h,
  });
  if (estado.outbox.deliveryLast24h.attempts >= 5 &&
      estado.outbox.deliveryLast24h.failureRate >= 0.2) alertas.push({
    codigo: 'TASA_ERROR_OUTBOX', nivel: 'warning',
    mensaje: 'La tasa de error de entrega externa supera el 20 % en 24 horas.',
    cantidad: estado.outbox.deliveryLast24h.failures,
  });
  if (estado.tendenciaColas.outbox.creadosPendientesUltimos15m >= 5 &&
      estado.tendenciaColas.outbox.crecimiento > 0) alertas.push({
    codigo: 'CRECIMIENTO_COLA_OUTBOX', nivel: 'warning',
    mensaje: 'La cola de eventos externos está creciendo en los últimos 15 minutos.',
    cantidad: estado.tendenciaColas.outbox.crecimiento,
  });
  if (estado.tendenciaColas.comunicaciones.creadosPendientesUltimos15m >= 5 &&
      estado.tendenciaColas.comunicaciones.crecimiento > 0) alertas.push({
    codigo: 'CRECIMIENTO_COLA_COMUNICACIONES', nivel: 'warning',
    mensaje: 'La cola de comunicaciones está creciendo en los últimos 15 minutos.',
    cantidad: estado.tendenciaColas.comunicaciones.crecimiento,
  });
  return alertas;
}
