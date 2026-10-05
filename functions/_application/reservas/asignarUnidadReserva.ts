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

  await auditoria.registrar(
    solicitud.actorEmail,
    'asignar_unidad',
    `Reserva #${solicitud.reservaId} → ${asignacion.unidad_asignada || '(sin asignar)'}`
  );

  return {
    ok: true,
    reservaId: asignacion.id,
    unidadAsignada: asignacion.unidad_asignada,
  };
}
