import type {
  NotificadorReservaConfirmada,
  ProveedorPagosReserva,
  RepositorioEstadoPagoReserva,
} from './ports.ts';

export type ResultadoProcesamientoPago =
  | { estado: 'pago_no_disponible' | 'referencia_invalida' | 'sin_cambios' | 'cancelada' }
  | { estado: 'confirmada'; notificacionFallida: boolean };

export async function procesarPagoMercadoPago(
  pagoId: string,
  pagos: ProveedorPagosReserva,
  reservas: RepositorioEstadoPagoReserva,
  notificador: NotificadorReservaConfirmada
): Promise<ResultadoProcesamientoPago> {
  const pago = await pagos.obtenerPago(pagoId);
  if (!pago) return { estado: 'pago_no_disponible' };

  const reservaId = Number(pago.referenciaExterna);
  if (!Number.isInteger(reservaId) || reservaId < 1) return { estado: 'referencia_invalida' };

  if (pago.estado === 'approved') {
    const reserva = await reservas.confirmar(reservaId, pago.id);
    if (!reserva?.manyChatUserId) return { estado: 'confirmada', notificacionFallida: false };

    try {
      await notificador.notificar(reserva);
      return { estado: 'confirmada', notificacionFallida: false };
    } catch {
      return { estado: 'confirmada', notificacionFallida: true };
    }
  }

  if (pago.estado === 'rejected' || pago.estado === 'cancelled') {
    await reservas.cancelarPendiente(reservaId, pago.id);
    return { estado: 'cancelada' };
  }

  return { estado: 'sin_cambios' };
}
