import type {
  RegistroAuditoriaReservas,
  RepositorioCreacionReserva,
  ReservaManualNueva,
} from './ports.ts';

export type SolicitudCreacionReservaManual = ReservaManualNueva & {
  actorEmail: string;
};

export type ResultadoCreacionReservaManual = {
  reservaId: number | undefined;
  disponible: boolean;
};

export async function crearReservaManual(
  solicitud: SolicitudCreacionReservaManual,
  repository: RepositorioCreacionReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ResultadoCreacionReservaManual> {
  const { actorEmail, ...reserva } = solicitud;
  const solapamientos = await repository.contarSolapamientos(
    reserva.alojamientoId,
    reserva.fechaCheckin,
    reserva.fechaCheckout
  );
  const creada = await repository.crearManual(reserva);

  await auditoria.registrar({
    email: actorEmail,
    accion: 'crear_reserva',
    entidadTipo: 'reserva',
    entidadId: creada.id,
    metadata: { canal: reserva.canalOrigen },
  });

  return {
    reservaId: creada.id,
    disponible: solapamientos === 0,
  };
}
