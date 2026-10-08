import { construirCalendarioDisponibilidad } from '../../_domain/reservas/availabilityCalendar.ts';
import { esFechaIso } from '../../_domain/reservas/dateRange.ts';
import type { RespuestaCalendario } from '../../_domain/reservas/models.ts';
import type { RepositorioCalendarioDisponibilidad } from './ports.ts';

const MENSAJE_RANGO_INVALIDO =
  "Parámetros 'desde' y 'hasta' (YYYY-MM-DD, hasta > desde) son requeridos.";

export async function consultarCalendarioDisponibilidad(
  desde: string,
  hasta: string,
  repository: RepositorioCalendarioDisponibilidad
): Promise<RespuestaCalendario> {
  if (!esFechaIso(desde) || !esFechaIso(hasta) || hasta <= desde) {
    return {
      ok: false,
      error: { codigo: 'RANGO_INVALIDO', mensaje: MENSAJE_RANGO_INVALIDO },
    };
  }

  const [alojamientos, reservas] = await Promise.all([
    repository.listarAlojamientos(),
    repository.listarReservasActivas(desde, hasta),
  ]);

  return {
    ok: true,
    valor: construirCalendarioDisponibilidad(desde, hasta, alojamientos, reservas),
  };
}
