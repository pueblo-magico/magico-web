import type {
  RegistroAuditoriaReservas,
  RepositorioAsignacionesReserva,
} from './ports.ts';

export type SolicitudAsignacionUnidad = {
  reservaId: number;
  unidadAsignada: string;
  actorEmail: string;
};

export type ResultadoAsignacionUnidad =
  | { ok: true; reservaId: number; unidadAsignada: string | null }
  | { ok: false; codigo: 'RESERVA_NO_ENCONTRADA' };

export async function asignarUnidadReserva(
  solicitud: SolicitudAsignacionUnidad,
  repository: RepositorioAsignacionesReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ResultadoAsignacionUnidad> {
  const unidadNormalizada = solicitud.unidadAsignada.trim();
  const asignacion = await repository.asignarUnidad(solicitud.reservaId, unidadNormalizada);

  if (!asignacion) return { ok: false, codigo: 'RESERVA_NO_ENCONTRADA' };

  await auditoria.registrar({
    email: solicitud.actorEmail,
    accion: 'asignar_unidad',
    entidadTipo: 'reserva',
    entidadId: solicitud.reservaId,
    metadata: { asignada: Boolean(asignacion.unidad_asignada) },
  });

  return {
    ok: true,
    reservaId: asignacion.id,
    unidadAsignada: asignacion.unidad_asignada,
  };
}
