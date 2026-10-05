import type {
  CambiosReserva,
  CampoEditableReserva,
  RegistroAuditoriaReservas,
  RepositorioEdicionReserva,
} from './ports.ts';

export const CAMPOS_EDITABLES_RESERVA: readonly CampoEditableReserva[] = [
  'cliente_nombre',
  'cliente_telefono',
  'cliente_email',
  'alojamiento_id',
  'fecha_checkin',
  'fecha_checkout',
  'cantidad_personas',
  'monto_total',
  'monto_sena',
  'estado',
  'canal_origen',
  'unidad_asignada',
];

export type ResultadoEdicionReserva =
  | { ok: true; reservaId: number }
  | { ok: false; codigo: 'RESERVA_NO_ENCONTRADA' };

export async function editarReserva(
  solicitud: { reservaId: number; cambios: CambiosReserva; actorEmail: string },
  repository: RepositorioEdicionReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ResultadoEdicionReserva> {
  const actualizada = await repository.actualizarParcial(solicitud.reservaId, solicitud.cambios);
  if (!actualizada) return { ok: false, codigo: 'RESERVA_NO_ENCONTRADA' };

  const accion = solicitud.cambios.estado === 'cancelada' ? 'cancelar_reserva' : 'editar_reserva';
  await auditoria.registrar({
    email: solicitud.actorEmail,
    accion,
    entidadTipo: 'reserva',
    entidadId: solicitud.reservaId,
    metadata: { campos: Object.keys(solicitud.cambios).sort() },
  });

  return { ok: true, reservaId: actualizada.id };
}
