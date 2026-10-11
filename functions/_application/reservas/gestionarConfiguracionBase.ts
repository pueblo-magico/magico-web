import {
  validarCambioModalidadComercial,
  validarCambioEspacioComercial,
  validarCambioParametroOperativo,
  validarCambioTarifaAlimentacion,
  type CambioModalidadComercial,
  type CambioEspacioComercial,
  type CambioParametroOperativo,
  type CambioTarifaAlimentacion,
  type ConfiguracionBaseReservas,
  type EspacioComercialActualizado,
  type ModalidadComercialActualizada,
  type ParametroOperativoReserva,
  type TarifaAlimentacionActualizada,
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

export async function actualizarModalidadConfiguracion(
  entrada: CambioModalidadComercial & { actorEmail: string; correlationId: string },
  repositorio: RepositorioConfiguracionBaseReservas,
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<ModalidadComercialActualizada> {
  const validada = validarCambioModalidadComercial(entrada);
  const actualizada = await repositorio.actualizarModalidad({
    ...validada,
    actorEmail: entrada.actorEmail,
    correlationId: entrada.correlationId,
    operacionUid: crearUuid(),
  });
  if (!actualizada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La modalidad cambió; actualizá la vista antes de reintentar.');
  }
  return actualizada;
}

export async function actualizarEspacioConfiguracion(
  entrada: CambioEspacioComercial & { actorEmail: string; correlationId: string },
  repositorio: RepositorioConfiguracionBaseReservas,
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<EspacioComercialActualizado> {
  const validada = validarCambioEspacioComercial(entrada);
  const actualizada = await repositorio.actualizarEspacio({
    ...validada,
    actorEmail: entrada.actorEmail,
    correlationId: entrada.correlationId,
    operacionUid: crearUuid(),
  });
  if (!actualizada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'El alojamiento cambió; actualizá la vista antes de reintentar.');
  }
  return actualizada;
}

export async function publicarTarifaAlimentacionConfiguracion(
  entrada: CambioTarifaAlimentacion & { actorEmail: string; correlationId: string },
  repositorio: RepositorioConfiguracionBaseReservas,
  crearUuid: () => string = () => crypto.randomUUID()
): Promise<TarifaAlimentacionActualizada> {
  const validada = validarCambioTarifaAlimentacion(entrada);
  const publicada = await repositorio.publicarTarifaAlimentacion({
    ...validada,
    actorEmail: entrada.actorEmail,
    correlationId: entrada.correlationId,
    operacionUid: crearUuid(),
  });
  if (!publicada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La tarifa cambió; actualizá la vista antes de reintentar.');
  }
  return publicada;
}
