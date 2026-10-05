import {
  estadoEsperadoParaAccion,
  validarSolicitudExcepcionCapacidad,
  type ExcepcionCapacidad,
  type NuevaSolicitudExcepcionCapacidad,
} from '../../_domain/reservas/capacityExceptions.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioExcepcionesCapacidad,
} from './ports.ts';

export type ComandoExcepcionCapacidad =
  | ({
      accion: 'solicitar';
      reservaId: number;
      actorEmail: string;
    } & NuevaSolicitudExcepcionCapacidad)
  | {
      accion: 'aprobar' | 'rechazar' | 'revocar';
      excepcionId: number;
      actorEmail: string;
    };

export async function gestionarExcepcionCapacidad(
  comando: ComandoExcepcionCapacidad,
  repositorio: RepositorioExcepcionesCapacidad,
  auditoria: RegistroAuditoriaReservas
): Promise<ExcepcionCapacidad> {
  if (comando.accion === 'solicitar') {
    const contexto = await repositorio.obtenerContextoPorReserva(comando.reservaId);
    if (!contexto) {
      throw new ErrorReserva('RESERVA_NO_ENCONTRADA', `No existe la reserva #${comando.reservaId}.`);
    }

    const validada = validarSolicitudExcepcionCapacidad(contexto, comando);
    const excepcion = await repositorio.crearSolicitud(validada, comando.actorEmail);
    await auditoria.registrar(
      comando.actorEmail,
      'solicitar_excepcion_capacidad',
      `Reserva #${contexto.reservaId} — capacidad ${excepcion.capacidadAutorizada}`
    );
    return excepcion;
  }

  const existente = await repositorio.obtenerPorId(comando.excepcionId);
  if (!existente) {
    throw new ErrorReserva('RESERVA_NO_ENCONTRADA', `No existe la excepción #${comando.excepcionId}.`);
  }

  const transicion = estadoEsperadoParaAccion(comando.accion);
  if (existente.estado !== transicion.actual) {
    throw new ErrorReserva(
      'CONFLICTO_RESERVA',
      `La excepción está ${existente.estado} y no se puede ${comando.accion}.`
    );
  }

  if (comando.accion === 'revocar') {
    const contexto = await repositorio.obtenerContextoPorReserva(existente.reservaId);
    if (!contexto) {
      throw new ErrorReserva('RESERVA_NO_ENCONTRADA', `No existe la reserva #${existente.reservaId}.`);
    }
    if (contexto.cantidadHuespedes > contexto.capacidadComercial) {
      throw new ErrorReserva(
        'CONFLICTO_RESERVA',
        `Antes de revocar, reducí la reserva a ${contexto.capacidadComercial} personas o menos.`
      );
    }
  }

  const actualizada = await repositorio.cambiarEstado(
    comando.excepcionId,
    transicion.actual,
    transicion.siguiente,
    comando.actorEmail
  );
  if (!actualizada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La excepción cambió mientras se procesaba la acción.');
  }

  await auditoria.registrar(
    comando.actorEmail,
    `${comando.accion}_excepcion_capacidad`,
    `Reserva #${actualizada.reservaId} — excepción #${actualizada.id}`
  );
  return actualizada;
}
