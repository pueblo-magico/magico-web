// Cloudflare Pages Function — asigna un lugar físico concreto (ej. "Domo 2" o
// "Cama 3 Habitación 1") a una reserva desde el Panel de Reservas.
//
// Protegido por sesión propia, roles super_admin/editor — ver
// functions/_lib/authGuard.ts y nota en functions/api/admin/reservas.ts.

import { requireRole } from '../../_lib/authGuard';
import { asignarUnidadReserva } from '../../_application/reservas/asignarUnidadReserva.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioAsignacionesReserva } from '../../_infrastructure/d1/D1RepositorioAsignacionesReserva.ts';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requireRole(request, env, ['super_admin', 'editor']);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400);
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
