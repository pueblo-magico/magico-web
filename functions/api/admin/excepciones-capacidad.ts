// Acción administrativa explícita para solicitar, aprobar, rechazar o revocar
// capacidad adicional de un domo. Nunca modifica la capacidad base del espacio.

import { gestionarExcepcionCapacidad } from '../../_application/reservas/gestionarExcepcionCapacidad.ts';
import type { ExcepcionCapacidad } from '../../_domain/reservas/capacityExceptions.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioExcepcionesCapacidad } from '../../_infrastructure/d1/D1RepositorioExcepcionesCapacidad.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';
import { requireAuth, tienePermiso } from '../../_lib/authGuard.ts';

const ACCIONES = ['solicitar', 'aprobar', 'rechazar', 'revocar'] as const;
type Accion = typeof ACCIONES[number];

function serializar(excepcion: ExcepcionCapacidad) {
  return {
    id: excepcion.id,
    reserva_id: excepcion.reservaId,
    reserva_estadia_id: excepcion.reservaEstadiaId,
    capacidad_autorizada: excepcion.capacidadAutorizada,
    motivo: excepcion.motivo,
    plan_camas: excepcion.planCamas,
    fecha_desde: excepcion.fechaDesde,
    fecha_hasta: excepcion.fechaHasta,
    estado: excepcion.estado,
    solicitada_por: excepcion.solicitadaPor,
    decidida_por: excepcion.decididaPor,
    solicitada_at: excepcion.solicitadaAt,
    decidida_at: excepcion.decididaAt,
  };
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400);
  }

  const accion = body?.accion as Accion;
  if (!ACCIONES.includes(accion)) {
    return json({ error: `accion debe ser una de: ${ACCIONES.join(', ')}.` }, 400);
  }

  const permiso = accion === 'solicitar'
    ? 'reservas.capacidad.solicitar'
    : 'reservas.capacidad.autorizar';
  if (!tienePermiso(auth, permiso)) {
    return json({ error: 'No tenés permiso para esta acción.' }, 403);
  }

  const repositorio = new D1RepositorioExcepcionesCapacidad(env.DB);
  const auditoria = new D1RegistroAuditoriaReservas(env.DB);

  try {
    if (accion === 'solicitar') {
      const reservaId = Number(body.reserva_id);
      if (!Number.isInteger(reservaId) || reservaId < 1) {
        return json({ error: 'reserva_id debe ser un entero válido.' }, 400);
      }

      const excepcion = await gestionarExcepcionCapacidad({
        accion,
        reservaId,
        capacidadAutorizada: Number(body.capacidad_autorizada),
        motivo: body.motivo,
        planCamas: body.plan_camas,
        fechaDesde: body.fecha_desde ?? null,
        fechaHasta: body.fecha_hasta ?? null,
        actorEmail: auth.email,
      }, repositorio, auditoria);
      return json({ ok: true, excepcion: serializar(excepcion) }, 201);
    }

    const excepcionId = Number(body.excepcion_id);
    if (!Number.isInteger(excepcionId) || excepcionId < 1) {
      return json({ error: 'excepcion_id debe ser un entero válido.' }, 400);
    }
    const excepcion = await gestionarExcepcionCapacidad({
      accion,
      excepcionId,
      actorEmail: auth.email,
    }, repositorio, auditoria);
    return json({ ok: true, excepcion: serializar(excepcion) });
  } catch (error: unknown) {
    return respuestaErrorReserva(error, {
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'No se pudo gestionar la excepción de capacidad.',
      status: 400,
    });
  }
}
