import { requireAuth, tienePermiso } from '../../_lib/authGuard.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { gestionarDatosPersonales } from '../../_application/reservas/gestionarDatosPersonales.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioDatosPersonalesReserva } from '../../_infrastructure/d1/D1RepositorioDatosPersonalesReserva.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request, 16 * 1024);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const accion = body.accion;
  if (accion !== 'exportar' && accion !== 'anonimizar') {
    return json({ error: "accion debe ser 'exportar' o 'anonimizar'." }, 400);
  }
  const permiso = accion === 'exportar' ? 'datos_personales.exportar' : 'datos_personales.anonimizar';
  if (!tienePermiso(auth, permiso)) return json({ error: 'No tenés permiso para esta acción.' }, 403);

  const reservaId = Number(body.reserva_id);
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';
  if (!Number.isInteger(reservaId) || reservaId < 1) return json({ error: 'reserva_id inválido.' }, 400);
  if (motivo.length < 10 || motivo.length > 500) {
    return json({ error: 'motivo debe tener entre 10 y 500 caracteres.' }, 400);
  }

  const correlationId = crypto.randomUUID();
  const resultado = await gestionarDatosPersonales(
    { accion, reservaId, actorEmail: auth.email, motivo, correlationId },
    new D1RepositorioDatosPersonalesReserva(env.DB),
    new D1RegistroAuditoriaReservas(env.DB)
  );
  if (!resultado.ok) return json({ error: 'No existe la reserva.' }, 404);

  if (accion === 'anonimizar') {
    return json({ ok: true, reserva_id: reservaId, correlation_id: correlationId });
  }

  return json({
    reserva: {
      ...resultado.datos,
    },
    correlation_id: correlationId,
  });
}
