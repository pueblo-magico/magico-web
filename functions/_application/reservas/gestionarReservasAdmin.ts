import {
  validarCambiosReservaAdmin,
  validarMotivoCambioSensible,
  validarNuevaReservaAdmin,
  type AccionEstadoReservaAdmin,
  type CambiosReservaAdmin,
  type NuevaReservaAdmin,
  type ResumenReservaAdmin,
} from '../../_domain/reservas/adminReservationManagement.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type { RepositorioGestionReservasAdmin } from './ports.ts';

function validarControl(reservaId: number, expectedVersion: number): void {
  if (!Number.isSafeInteger(reservaId) || reservaId < 1 ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva o la versión es inválida.');
  }
}

export async function crearReservaAdmin(
  reserva: NuevaReservaAdmin,
  actorEmail: string,
  correlationId: string,
  repositorio: RepositorioGestionReservasAdmin
): Promise<ResumenReservaAdmin> {
  const uid = crypto.randomUUID();
  return repositorio.crear({
    reserva: validarNuevaReservaAdmin(reserva),
    reservaUid: uid,
    reservaCodigo: `RES-${uid.slice(0, 8).toUpperCase()}`,
    actorEmail,
    correlationId,
  });
}

export async function editarReservaAdmin(
  entrada: {
    reservaId: number;
    expectedVersion: number;
    cambios: CambiosReservaAdmin;
    actorEmail: string;
    correlationId: string;
  },
  repositorio: RepositorioGestionReservasAdmin
): Promise<ResumenReservaAdmin> {
  validarControl(entrada.reservaId, entrada.expectedVersion);
  const actualizada = await repositorio.editar({
    ...entrada,
    cambios: validarCambiosReservaAdmin(entrada.cambios),
    operacionUid: crypto.randomUUID(),
  });
  if (!actualizada) throw new ErrorReserva('CONFLICTO_RESERVA', 'La reserva cambió; actualizá los datos e intentá nuevamente.');
  return actualizada;
}

export async function cambiarEstadoReservaAdmin(
  entrada: {
    reservaId: number;
    expectedVersion: number;
    accion: AccionEstadoReservaAdmin;
    motivo: unknown;
    actorEmail: string;
    correlationId: string;
  },
  repositorio: RepositorioGestionReservasAdmin
): Promise<ResumenReservaAdmin> {
  validarControl(entrada.reservaId, entrada.expectedVersion);
  if (!['confirmar', 'cancelar', 'vencer'].includes(entrada.accion)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La transición solicitada es inválida.');
  }
  const actualizada = await repositorio.cambiarEstado({
    ...entrada,
    motivo: validarMotivoCambioSensible(entrada.motivo),
    operacionUid: crypto.randomUUID(),
  });
  if (!actualizada) throw new ErrorReserva('CONFLICTO_RESERVA', 'La transición no es válida o la reserva cambió.');
  return actualizada;
}
