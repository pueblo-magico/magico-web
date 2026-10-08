import type { ResultadoCotizacion, SolicitudCotizacion } from '../../_domain/reservas/models.ts';
import { cotizarEstadia } from './cotizarEstadia.ts';
import type {
  ProveedorCheckoutReserva,
  RepositorioCotizaciones,
  RepositorioDisponibilidad,
  RepositorioTarifas,
  RepositorioTarifasAlimentacion,
  RepositorioReservasManyChat,
} from './ports.ts';

export type ResultadoInicioReservaManyChat =
  | { estado: 'error_validacion'; mensaje: string }
  | { estado: 'ocupado' }
  | { estado: 'error_creacion' }
  | { estado: 'error_pago'; reservaId: number }
  | {
      estado: 'pendiente_pago';
      reservaId: number;
      checkoutUrl: string | null;
      cotizacion: ResultadoCotizacion;
    };

export async function iniciarReservaManyChat(
  solicitud: SolicitudCotizacion & { userId: string },
  disponibilidad: RepositorioDisponibilidad,
  tarifas: RepositorioTarifas,
  tarifasAlimentacion: RepositorioTarifasAlimentacion,
  cotizaciones: RepositorioCotizaciones,
  reservas: RepositorioReservasManyChat,
  checkout: ProveedorCheckoutReserva
): Promise<ResultadoInicioReservaManyChat> {
  const resultadoCotizacion = await cotizarEstadia(
    solicitud,
    disponibilidad,
    tarifas,
    tarifasAlimentacion,
    cotizaciones
  );
  if (resultadoCotizacion.ok === false) {
    return { estado: 'error_validacion', mensaje: resultadoCotizacion.error.mensaje };
  }

  const cotizacion = resultadoCotizacion.valor;
  if (!cotizacion.referencia) return { estado: 'error_creacion' };
  if (
    cotizacion.disponibilidad.estado === 'ocupado' ||
    cotizacion.disponibilidad.alojamiento_id === null
  ) {
    return { estado: 'ocupado' };
  }

  const creada = await reservas.crearPendiente({
    clienteNombre: `ManyChat #${solicitud.userId}`,
    alojamientoId: cotizacion.disponibilidad.alojamiento_id,
    fechaCheckin: solicitud.fechaEntrada,
    fechaCheckout: solicitud.fechaSalida,
    cantidadPersonas: solicitud.personas,
    montoTotal: cotizacion.desglose.subtotal,
    montoSena: cotizacion.sena.monto,
    manyChatUserId: solicitud.userId,
    cotizacionId: cotizacion.referencia.id,
  });

  if (!creada.id) return { estado: 'error_creacion' };

  try {
    const preferencia = await checkout.crearPreferencia({
      reservaId: creada.id,
      tipoAlojamiento: solicitud.tipo,
      montoSena: cotizacion.sena.monto,
    });
    await reservas.guardarPreferenciaPago(creada.id, preferencia.preferenciaId);

    return {
      estado: 'pendiente_pago',
      reservaId: creada.id,
      checkoutUrl: preferencia.checkoutUrl,
      cotizacion,
    };
  } catch {
    // La reserva pendiente se conserva para diagnóstico y limpieza posterior.
    return { estado: 'error_pago', reservaId: creada.id };
  }
}
