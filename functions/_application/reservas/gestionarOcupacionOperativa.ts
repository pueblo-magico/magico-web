import {
  validarNuevaEstadiaNoComercial,
  validarNuevoBloqueo,
  type NuevaEstadiaNoComercial,
  type NuevoBloqueoInventario,
  type RegistroOcupacionOperativa,
} from '../../_domain/reservas/operationalOccupancy.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioOcupacionOperativa,
} from './ports.ts';

export async function crearBloqueoInventario(
  entrada: NuevoBloqueoInventario,
  actorEmail: string,
  repositorio: RepositorioOcupacionOperativa,
  auditoria: RegistroAuditoriaReservas
): Promise<RegistroOcupacionOperativa> {
  const creado = await repositorio.crearBloqueo(validarNuevoBloqueo(entrada), actorEmail);
  await auditoria.registrar({
    email: actorEmail, accion: 'crear_bloqueo_inventario', entidadTipo: 'bloqueo_inventario', entidadId: creado.id,
    metadata: { codigo: creado.codigo, tipo: creado.tipo, fecha_desde: creado.fechaDesde, fecha_hasta: creado.fechaHasta },
  });
  return creado;
}

export async function crearEstadiaNoComercial(
  entrada: NuevaEstadiaNoComercial,
  actorEmail: string,
  repositorio: RepositorioOcupacionOperativa,
  auditoria: RegistroAuditoriaReservas
): Promise<RegistroOcupacionOperativa> {
  const creada = await repositorio.crearEstadiaNoComercial(validarNuevaEstadiaNoComercial(entrada), actorEmail);
  await auditoria.registrar({
    email: actorEmail, accion: 'crear_estadia_no_comercial', entidadTipo: 'estadia_no_comercial', entidadId: creada.id,
    metadata: { codigo: creada.codigo, tipo: creada.tipo, fecha_desde: creada.fechaDesde, fecha_hasta: creada.fechaHasta },
  });
  return creada;
}

export async function cancelarOcupacionOperativa(
  clase: 'bloqueo' | 'estadia_no_comercial',
  id: number,
  actorEmail: string,
  repositorio: RepositorioOcupacionOperativa,
  auditoria: RegistroAuditoriaReservas
): Promise<RegistroOcupacionOperativa> {
  if (!Number.isSafeInteger(id) || id < 1) throw new ErrorReserva('DATOS_INVALIDOS', 'El identificador es inválido.');
  const cancelada = clase === 'bloqueo'
    ? await repositorio.cancelarBloqueo(id, actorEmail)
    : await repositorio.cancelarEstadiaNoComercial(id, actorEmail);
  if (!cancelada) throw new ErrorReserva('CONFLICTO_RESERVA', 'El registro no existe o ya fue cancelado.');
  await auditoria.registrar({
    email: actorEmail,
    accion: clase === 'bloqueo' ? 'cancelar_bloqueo_inventario' : 'cancelar_estadia_no_comercial',
    entidadTipo: clase === 'bloqueo' ? 'bloqueo_inventario' : 'estadia_no_comercial',
    entidadId: id,
    metadata: { codigo: cancelada.codigo },
  });
  return cancelada;
}
