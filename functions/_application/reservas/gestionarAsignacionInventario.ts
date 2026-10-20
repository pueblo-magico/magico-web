import type { ModalidadAlojamiento } from '../../_domain/reservas/accommodationInventory.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import { planificarAsignacionInventario } from '../../_domain/reservas/inventoryAssignment.ts';
import type {
  AsignacionInventarioGuardada,
  RepositorioAsignacionInventario,
} from './ports.ts';

export type SolicitudAsignacionInventario = {
  reservaId: number;
  expectedVersion: number;
  espacioCodigo: string;
  modalidad: ModalidadAlojamiento;
  unidadesCodigos: string[];
  actorEmail: string;
  correlationId: string;
  operacionUid?: string;
};

function validarIdentificadores(reservaId: number, espacioCodigo: string): void {
  if (!Number.isSafeInteger(reservaId) || reservaId < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva es inválida.');
  }
  if (!/^[a-z0-9-]{1,80}$/.test(espacioCodigo)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El espacio es inválido.');
  }
}

export async function asignarInventarioReserva(
  solicitud: SolicitudAsignacionInventario,
  repositorio: RepositorioAsignacionInventario
): Promise<AsignacionInventarioGuardada> {
  validarIdentificadores(solicitud.reservaId, solicitud.espacioCodigo);
  if (!['privada', 'compartida', 'camping'].includes(solicitud.modalidad)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La modalidad es inválida.');
  }
  const contexto = await repositorio.obtenerContexto(
    solicitud.reservaId,
    solicitud.espacioCodigo,
    solicitud.modalidad
  );
  if (!contexto) throw new ErrorReserva('RESERVA_NO_ENCONTRADA', 'La reserva o el espacio no existe.');
  const plan = planificarAsignacionInventario(contexto, {
    expectedVersion: solicitud.expectedVersion,
    unidadesCodigos: solicitud.unidadesCodigos,
  });
  const guardada = await repositorio.reemplazar({
    contexto,
    plan,
    operacionUid: solicitud.operacionUid || crypto.randomUUID(),
    actorEmail: solicitud.actorEmail,
    correlationId: solicitud.correlationId,
  });
  if (!guardada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La reserva o el inventario cambió durante la asignación.');
  }
  return guardada;
}

export async function liberarInventarioReserva(
  solicitud: Omit<SolicitudAsignacionInventario, 'espacioCodigo' | 'modalidad' | 'unidadesCodigos'>,
  repositorio: RepositorioAsignacionInventario
): Promise<AsignacionInventarioGuardada> {
  if (!Number.isSafeInteger(solicitud.reservaId) || solicitud.reservaId < 1 ||
      !Number.isSafeInteger(solicitud.expectedVersion) || solicitud.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva o la versión es inválida.');
  }
  const guardada = await repositorio.liberar({
    reservaId: solicitud.reservaId,
    expectedVersion: solicitud.expectedVersion,
    operacionUid: solicitud.operacionUid || crypto.randomUUID(),
    actorEmail: solicitud.actorEmail,
    correlationId: solicitud.correlationId,
  });
  if (!guardada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La reserva cambió o no tiene una asignación activa.');
  }
  return guardada;
}
