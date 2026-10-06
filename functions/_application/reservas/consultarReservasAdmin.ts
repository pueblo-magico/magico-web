import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import {
  validarFiltrosReservasAdmin,
  type DetalleReservaAdmin,
  type FiltrosReservasAdmin,
  type PaginaReservasAdmin,
} from '../../_domain/reservas/adminReservationManagement.ts';
import type {
  HistorialReserva,
  AsignacionInventarioGuardada,
  RepositorioAsignacionInventario,
  RepositorioGestionReservasAdmin,
  RepositorioHistorialReserva,
} from './ports.ts';

export function listarReservasAdmin(
  filtros: Partial<FiltrosReservasAdmin>,
  repositorio: RepositorioGestionReservasAdmin
): Promise<PaginaReservasAdmin> {
  return repositorio.listar(validarFiltrosReservasAdmin(filtros));
}

export async function consultarReservaAdmin(
  reservaId: number,
  repositorio: RepositorioGestionReservasAdmin,
  historial: RepositorioHistorialReserva,
  asignaciones: RepositorioAsignacionInventario
): Promise<{
  reserva: DetalleReservaAdmin;
  historial: HistorialReserva;
  asignacion: AsignacionInventarioGuardada;
}> {
  if (!Number.isSafeInteger(reservaId) || reservaId < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva es inválida.');
  }
  const [reserva, eventosPagos, asignacion] = await Promise.all([
    repositorio.obtenerDetalle(reservaId),
    historial.obtener(reservaId),
    asignaciones.obtenerActual(reservaId),
  ]);
  if (!reserva || !eventosPagos || !asignacion) {
    throw new ErrorReserva('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
  }
  return { reserva, historial: eventosPagos, asignacion };
}
