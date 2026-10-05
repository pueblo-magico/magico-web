// Cloudflare Pages Function — asigna un lugar físico concreto (ej. "Domo 2" o
// "Cama 3 Habitación 1") a una reserva desde el Panel de Reservas.
//
// Protegido por sesión propia, roles super_admin/editor — ver
// functions/_lib/authGuard.ts y nota en functions/api/admin/reservas.ts.

import { requirePermission } from '../../_lib/authGuard';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { asignarUnidadReserva } from '../../_application/reservas/asignarUnidadReserva.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioAsignacionesReserva } from '../../_infrastructure/d1/D1RepositorioAsignacionesReserva.ts';
import { jsonReserva as json } from '../../_interfaces/http/reservasHttp.ts';

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.asignar');
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const { reserva_id, unidad_asignada } = body || {};
  const id = Number(reserva_id);

  if (!Number.isInteger(id) || id < 1) {
    return json({ error: 'reserva_id debe ser un entero válido.' }, 400);
  }
  if (typeof unidad_asignada !== 'string') {
    return json({ error: 'unidad_asignada debe ser un texto.' }, 400);
  }

  const resultado = await asignarUnidadReserva(
    { reservaId: id, unidadAsignada: unidad_asignada, actorEmail: auth.email },
    new D1RepositorioAsignacionesReserva(env.DB),
    new D1RegistroAuditoriaReservas(env.DB)
  );

  if (!resultado.ok) {
    return json({ error: `No existe la reserva #${id}.` }, 404);
  }

  return json({
    ok: true,
    reserva_id: resultado.reservaId,
    unidad_asignada: resultado.unidadAsignada,
  });
}
