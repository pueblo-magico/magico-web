import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import {
  reglasPoliticaValidas,
  type BorradorPoliticaCancelacion,
} from '../../_domain/reservas/refundPolicies.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioExcepcionesPoliticaReserva,
  RepositorioPoliticasCancelacion,
  ExcepcionPoliticaReserva,
  ResumenPoliticaCancelacion,
} from './ports.ts';

function fechaIsoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(valor)) return false;
  const timestamp = Date.parse(valor);
  if (!Number.isFinite(timestamp)) return false;
  const canonico = valor.includes('.') ? valor : valor.replace('Z', '.000Z');
  return new Date(timestamp).toISOString() === canonico;
}

export async function solicitarExcepcionPoliticaReserva(
  entrada: {
    reservaId: number;
    tipo: ExcepcionPoliticaReserva['tipo'];
    montoDevolucionCentavos: number | null;
    motivo: string;
  },
  actorEmail: string,
  repositorio: RepositorioExcepcionesPoliticaReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ExcepcionPoliticaReserva> {
  if (!Number.isSafeInteger(entrada.reservaId) || entrada.reservaId < 1 ||
      !['cancelacion', 'devolucion', 'vencimiento'].includes(entrada.tipo) ||
      entrada.motivo.trim().length < 3 || entrada.motivo.trim().length > 500 ||
      (entrada.montoDevolucionCentavos !== null &&
        (!Number.isSafeInteger(entrada.montoDevolucionCentavos) || entrada.montoDevolucionCentavos < 0))) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La excepción de política es inválida.');
  }
  const creada = await repositorio.solicitar({
    ...entrada, motivo: entrada.motivo.trim(), actorEmail,
  });
  if (!creada) throw new ErrorReserva('RESERVA_NO_ENCONTRADA', 'La reserva no existe.');
  await auditoria.registrar({
    email: actorEmail,
    accion: 'solicitar_excepcion_politica_reserva',
    entidadTipo: 'excepcion_politica_reserva',
    entidadId: creada.id,
    motivo: creada.motivo,
    metadata: { reserva_id: creada.reservaId, tipo: creada.tipo },
  });
  return creada;
}

export async function resolverExcepcionPoliticaReserva(
  id: number,
  estado: 'aprobada' | 'rechazada',
  actorEmail: string,
  repositorio: RepositorioExcepcionesPoliticaReserva,
  auditoria: RegistroAuditoriaReservas
): Promise<ExcepcionPoliticaReserva> {
  if (!Number.isSafeInteger(id) || id < 1 || !['aprobada', 'rechazada'].includes(estado)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La resolución de la excepción es inválida.');
  }
  const resuelta = await repositorio.resolver(id, estado, actorEmail);
  if (!resuelta) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La excepción no existe o ya fue resuelta.');
  }
  await auditoria.registrar({
    email: actorEmail,
    accion: `${estado === 'aprobada' ? 'aprobar' : 'rechazar'}_excepcion_politica_reserva`,
    entidadTipo: 'excepcion_politica_reserva',
    entidadId: resuelta.id,
    motivo: resuelta.motivo,
    metadata: { reserva_id: resuelta.reservaId, tipo: resuelta.tipo },
  });
  return resuelta;
}

export async function crearBorradorPoliticaCancelacion(
  politica: BorradorPoliticaCancelacion,
  actorEmail: string,
  repositorio: RepositorioPoliticasCancelacion,
  auditoria: RegistroAuditoriaReservas
): Promise<ResumenPoliticaCancelacion> {
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(politica.codigo) ||
      politica.nombre.trim().length < 3 || politica.nombre.trim().length > 120 ||
      !fechaIsoValida(politica.vigenciaDesde) || !reglasPoliticaValidas(politica.reglas)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La política de cancelación es inválida.');
  }
  const creada = await repositorio.crearBorrador({ ...politica, nombre: politica.nombre.trim() });
  await auditoria.registrar({
    email: actorEmail,
    accion: 'crear_borrador_politica_cancelacion',
    entidadTipo: 'politica_cancelacion',
    entidadId: creada.id,
    metadata: { codigo: creada.codigo, version: creada.version },
  });
  return creada;
}

export async function publicarPoliticaCancelacion(
  id: number,
  actorEmail: string,
  repositorio: RepositorioPoliticasCancelacion,
  auditoria: RegistroAuditoriaReservas
): Promise<ResumenPoliticaCancelacion> {
  const publicada = await repositorio.publicar(id);
  if (!publicada) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'La política no existe o ya no está en borrador.');
  }
  await auditoria.registrar({
    email: actorEmail,
    accion: 'publicar_politica_cancelacion',
    entidadTipo: 'politica_cancelacion',
    entidadId: publicada.id,
    metadata: { codigo: publicada.codigo, version: publicada.version },
  });
  return publicada;
}
