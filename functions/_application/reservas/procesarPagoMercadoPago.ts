import type {
  NotificadorReservaConfirmada,
  ProveedorPagosReserva,
  RepositorioEstadoPagoReserva,
} from './ports.ts';
import { transicionPagoValida, type EstadoPagoReserva } from '../../_domain/reservas/paymentLifecycle.ts';

export type ResultadoProcesamientoPago =
  | { estado: 'pago_no_disponible' | 'referencia_invalida' | 'reserva_desconocida' | 'pago_inconsistente' | 'duplicado' | 'sin_cambios' | 'cancelada' }
  | { estado: 'confirmada'; notificacionFallida: boolean };

export async function procesarPagoMercadoPago(
  pagoId: string,
  pagos: ProveedorPagosReserva,
  reservas: RepositorioEstadoPagoReserva,
  notificador: NotificadorReservaConfirmada,
  eventoExternoId = `payment:${pagoId}`,
  correlationId = eventoExternoId
): Promise<ResultadoProcesamientoPago> {
  const pago = await pagos.obtenerPago(pagoId);
  if (!pago) return { estado: 'pago_no_disponible' };

  const referencia = String(pago.referenciaExterna ?? '').trim();
  const reservaIdLegacy = Number(referencia);
  const referenciaNumerica = Number.isInteger(reservaIdLegacy) && reservaIdLegacy > 0;
  const referenciaCodigo = /^RES-[0-9a-f-]{36}$/i.test(referencia);
  const referenciaValida = referenciaNumerica || referenciaCodigo;
  const esperada = referenciaNumerica
    ? await reservas.obtenerEsperado(reservaIdLegacy)
    : referenciaCodigo && reservas.obtenerEsperadoPorCodigo
      ? await reservas.obtenerEsperadoPorCodigo(referencia)
      : null;
  const reservaId = esperada?.reservaId ?? 0;
  const motivo = !referenciaValida
    ? 'REFERENCIA_INVALIDA'
    : !esperada
      ? 'RESERVA_DESCONOCIDA'
      : pago.montoCentavos !== esperada.montoCentavos
        ? 'MONTO_INCORRECTO'
        : pago.moneda !== esperada.moneda
          ? 'MONEDA_INCORRECTA'
          : null;

  const observacion = {
    proveedor: 'mercado_pago', eventoExternoId, correlationId, pago,
    reservaId: esperada?.reservaId ?? null,
    resultado: motivo
      ? 'inconsistente' as const
      : ['approved', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(pago.estado)
        ? 'aplicado' as const
        : 'sin_cambios' as const,
    motivoCodigo: motivo,
  };
  if (motivo) {
    if (!await reservas.registrarObservacion(observacion)) return { estado: 'duplicado' };
    if (motivo === 'REFERENCIA_INVALIDA') return { estado: 'referencia_invalida' };
    if (motivo === 'RESERVA_DESCONOCIDA') return { estado: 'reserva_desconocida' };
    return { estado: 'pago_inconsistente' };
  }

  const estadoNormalizado: EstadoPagoReserva = pago.estado === 'approved'
    ? 'aprobado'
    : pago.estado === 'rejected' || pago.estado === 'cancelled'
      ? 'rechazado'
      : pago.estado === 'refunded' || pago.estado === 'charged_back'
        ? 'devuelto'
        : 'pendiente';
  const estadoActual = await reservas.obtenerEstadoPago(observacion.proveedor, pago.id);
  if (estadoActual && !transicionPagoValida(estadoActual, estadoNormalizado)) {
    const inconsistente = {
      ...observacion,
      resultado: 'inconsistente' as const,
      motivoCodigo: 'TRANSICION_PAGO_INVALIDA',
    };
    if (!await reservas.registrarObservacion(inconsistente)) return { estado: 'duplicado' };
    return { estado: 'pago_inconsistente' };
  }

  if (pago.estado === 'approved') {
    await reservas.registrarPago({ ...observacion, resultado: 'aplicado' }, 'aprobado');
    const reserva = await reservas.confirmar(reservaId, pago.id);
    const registrada = await reservas.registrarObservacion({
      ...observacion,
      resultado: reserva ? 'aplicado' : 'sin_cambios',
    });
    if (!registrada) return { estado: 'duplicado' };
    if (!reserva) return { estado: 'sin_cambios' };
    if (!reserva.manyChatUserId) return { estado: 'confirmada', notificacionFallida: false };

    try {
      await notificador.notificar(reserva);
      return { estado: 'confirmada', notificacionFallida: false };
    } catch {
      return { estado: 'confirmada', notificacionFallida: true };
    }
  }

  if (pago.estado === 'rejected' || pago.estado === 'cancelled') {
    await reservas.cancelarPendiente(reservaId, pago.id);
    await reservas.registrarPago({ ...observacion, resultado: 'aplicado' }, 'rechazado');
    if (!await reservas.registrarObservacion(observacion)) return { estado: 'duplicado' };
    return { estado: 'cancelada' };
  }

  if (pago.estado === 'refunded' || pago.estado === 'charged_back') {
    await reservas.registrarPago({ ...observacion, resultado: 'aplicado' }, 'devuelto');
    if (!await reservas.registrarObservacion(observacion)) return { estado: 'duplicado' };
    return { estado: 'sin_cambios' };
  }

  await reservas.registrarPago({ ...observacion, resultado: 'sin_cambios' }, 'pendiente');
  if (!await reservas.registrarObservacion(observacion)) return { estado: 'duplicado' };

  return { estado: 'sin_cambios' };
}
