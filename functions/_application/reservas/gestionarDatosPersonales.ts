import type {
  DatosPersonalesReserva,
  RegistroAuditoriaReservas,
  RepositorioDatosPersonalesReserva,
} from './ports.ts';

export type SolicitudDatosPersonales = {
  accion: 'exportar' | 'anonimizar';
  reservaId: number;
  actorEmail: string;
  motivo: string;
  correlationId: string;
};

export type ResultadoDatosPersonales =
  | { ok: false }
  | { ok: true; datos: DatosPersonalesReserva | null };

export async function gestionarDatosPersonales(
  solicitud: SolicitudDatosPersonales,
  repositorio: RepositorioDatosPersonalesReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ResultadoDatosPersonales> {
  const reserva = await repositorio.obtener(solicitud.reservaId);
  if (!reserva) return { ok: false };

  if (solicitud.accion === 'anonimizar') await repositorio.anonimizar(solicitud.reservaId);
  await repositorio.registrarSolicitud({
    reservaId: solicitud.reservaId,
    tipo: solicitud.accion === 'exportar' ? 'exportacion' : 'anonimizacion',
    actorEmail: solicitud.actorEmail,
    motivo: solicitud.motivo,
    correlationId: solicitud.correlationId,
  });
  await auditoria.registrar({
    email: solicitud.actorEmail,
    accion: solicitud.accion === 'exportar' ? 'exportar_datos_personales' : 'anonimizar_datos_personales',
    entidadTipo: 'reserva',
    entidadId: solicitud.reservaId,
    motivo: solicitud.motivo,
    correlationId: solicitud.correlationId,
  });
  return { ok: true, datos: solicitud.accion === 'exportar' ? reserva : null };
}
