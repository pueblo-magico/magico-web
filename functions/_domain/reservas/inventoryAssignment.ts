import type { ModalidadAlojamiento } from './accommodationInventory.ts';
import { agregarDiasIso, nochesEntre } from './dateRange.ts';
import { ErrorReserva } from './errors.ts';

export type UnidadParaAsignar = {
  id: number;
  codigo: string;
  capacidad: number;
};

export type ContextoAsignacionInventario = {
  reservaId: number;
  reservaVersion: number;
  estadoFlujo: string;
  estadiaId: number;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadHuespedes: number;
  espacioId: number;
  espacioCodigo: string;
  espacioTipo: string;
  capacidadComercial: number;
  modalidad: ModalidadAlojamiento;
  modalidadHabilitada: boolean;
  unidades: UnidadParaAsignar[];
};

export type SolicitudPlanAsignacion = {
  expectedVersion: number;
  unidadesCodigos: string[];
};

export type PlanAsignacionInventario = {
  noches: string[];
  unidadesBloqueadas: UnidadParaAsignar[];
  asignaciones: Array<UnidadParaAsignar & { cantidadHuespedes: number }>;
};

export function planificarAsignacionInventario(
  contexto: ContextoAsignacionInventario,
  solicitud: SolicitudPlanAsignacion
): PlanAsignacionInventario {
  if (!Number.isSafeInteger(solicitud.expectedVersion) || solicitud.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La versión esperada es inválida.');
  }
  if (contexto.reservaVersion !== solicitud.expectedVersion) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La reserva cambió; actualizá los datos antes de asignar.');
  }
  if (contexto.estadoFlujo !== 'confirmada') {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'Sólo se puede asignar inventario a una reserva confirmada.');
  }
  if (!contexto.modalidadHabilitada || contexto.espacioTipo === 'salon') {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La modalidad no está habilitada para este espacio.');
  }
  if (contexto.cantidadHuespedes > contexto.capacidadComercial) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La cantidad de huéspedes supera la capacidad comercial.');
  }

  const cantidadNoches = nochesEntre(contexto.fechaCheckin, contexto.fechaCheckout);
  if (!cantidadNoches) throw new ErrorReserva('DATOS_INVALIDOS', 'Las fechas de la estadía son inválidas.');
  const noches = Array.from({ length: cantidadNoches }, (_, indice) =>
    agregarDiasIso(contexto.fechaCheckin, indice)
  );

  const porCodigo = new Map(contexto.unidades.map(unidad => [unidad.codigo, unidad]));
  const codigos = [...new Set(solicitud.unidadesCodigos.map(codigo => codigo.trim()).filter(Boolean))];
  let unidadesBloqueadas: UnidadParaAsignar[];
  if (contexto.modalidad === 'privada') {
    unidadesBloqueadas = contexto.unidades;
  } else {
    if (codigos.length === 0) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'Seleccioná al menos una unidad de inventario.');
    }
    unidadesBloqueadas = codigos.map(codigo => {
      const unidad = porCodigo.get(codigo);
      if (!unidad) throw new ErrorReserva('DATOS_INVALIDOS', `La unidad ${codigo} no pertenece al espacio.`);
      return unidad;
    });
  }
  if (unidadesBloqueadas.length === 0) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El espacio no tiene unidades asignables configuradas.');
  }

  let restantes = contexto.cantidadHuespedes;
  const asignaciones = unidadesBloqueadas.flatMap(unidad => {
    if (restantes === 0) return [];
    const cantidadHuespedes = Math.min(restantes, unidad.capacidad);
    restantes -= cantidadHuespedes;
    return [{ ...unidad, cantidadHuespedes }];
  });
  if (restantes > 0) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'Las unidades seleccionadas no tienen capacidad suficiente.');
  }

  return { noches, unidadesBloqueadas, asignaciones };
}
