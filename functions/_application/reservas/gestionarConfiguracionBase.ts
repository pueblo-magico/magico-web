import {
  validarCambioParametroOperativo,
  type CambioParametroOperativo,
  type ConfiguracionBaseReservas,
  type ParametroOperativoReserva,
} from '../../_domain/reservas/baseConfiguration.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type { RepositorioConfiguracionBaseReservas } from './ports.ts';

export function consultarConfiguracionBase(
  repositorio: RepositorioConfiguracionBaseReservas
): Promise<ConfiguracionBaseReservas> {
  return repositorio.obtenerEfectiva();
}

export async function actualizarParametroConfiguracion(
  entrada: CambioParametroOperativo & { actorEmail: string; correlationId: string },
  repositorio: RepositorioConfiguracionBaseReservas,
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<ParametroOperativoReserva> {
  const validada = validarCambioParametroOperativo(entrada);
  const actualizada = await repositorio.actualizarParametro({
    ...validada,
    actorEmail: entrada.actorEmail,
    correlationId: entrada.correlationId,
    operacionUid: crearUuid(),
  });
  if (!actualizada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La configuración cambió; actualizá la vista antes de reintentar.');
  }
  return actualizada;
}
