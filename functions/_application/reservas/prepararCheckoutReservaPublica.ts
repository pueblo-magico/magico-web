import type {
  ProveedorCheckoutReserva,
  RepositorioCheckoutReservaPublica,
} from './ports.ts';

export type ResultadoCheckoutReservaPublica =
  | { estado: 'disabled' }
  | { estado: 'pending' }
  | { estado: 'expired' }
  | { estado: 'failed' }
  | { estado: 'ready'; checkoutUrl: string; preferenciaId: string };

function vigente(expiresAt: string | null, ahora: Date): boolean {
  if (!expiresAt) return true;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp > ahora.getTime();
}

export async function prepararCheckoutReservaPublica(
  entrada: {
    reservaId: number;
    habilitado: boolean;
    correlationId: string;
  },
  repositorio: RepositorioCheckoutReservaPublica,
  proveedor: ProveedorCheckoutReserva,
  ahora: () => Date = () => new Date()
): Promise<ResultadoCheckoutReservaPublica> {
  if (!entrada.habilitado) return { estado: 'disabled' };

  const reserva = await repositorio.obtener(entrada.reservaId);
  if (!reserva) return { estado: 'failed' };
  if (reserva.checkoutUrl && reserva.preferenciaId) {
    return {
      estado: 'ready',
      checkoutUrl: reserva.checkoutUrl,
      preferenciaId: reserva.preferenciaId,
    };
  }
  if (reserva.estadoFlujo !== 'pendiente_pago' || !vigente(reserva.expiresAt, ahora())) {
    return { estado: 'expired' };
  }

  const reclamada = await repositorio.reclamarProvisionamiento(reserva.reservaId);
  if (!reclamada) return { estado: 'pending' };

  try {
    const recuperada = proveedor.buscarPreferenciaPorReferencia
      ? await proveedor.buscarPreferenciaPorReferencia(reserva.reservaCodigo)
      : null;
    const preferencia = recuperada || await proveedor.crearPreferencia({
      reservaId: reserva.reservaId,
      reservaCodigo: reserva.reservaCodigo,
      tipoAlojamiento: reserva.tipoAlojamiento,
      montoSena: reserva.montoSenaCentavos / 100,
    });
    if (!preferencia.checkoutUrl) {
      await repositorio.registrarFallo(reserva.reservaId, 'MP_CHECKOUT_URL_AUSENTE');
      return { estado: 'failed' };
    }
    await repositorio.guardarPreferencia(
      reserva.reservaId,
      preferencia.preferenciaId,
      preferencia.checkoutUrl,
      entrada.correlationId
    );
    return {
      estado: 'ready',
      checkoutUrl: preferencia.checkoutUrl,
      preferenciaId: preferencia.preferenciaId,
    };
  } catch {
    await repositorio.registrarFallo(reserva.reservaId, 'MP_PREFERENCE_ERROR');
    return { estado: 'failed' };
  }
}
