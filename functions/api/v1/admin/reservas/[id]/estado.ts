import { cambiarEstadoReservaAdmin } from '../../../../../_application/reservas/gestionarReservasAdmin.ts';
import { D1RepositorioGestionReservasAdmin } from '../../../../../_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requireAuth, tienePermiso } from '../../../../../_lib/authGuard.ts';
import type { AccionEstadoReservaAdmin } from '../../../../../_domain/reservas/adminReservationManagement.ts';

async function cambiar(
  request: Request, env: any, params: any, correlationId: string
): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  const accion = body.accion as AccionEstadoReservaAdmin;
  const permiso = accion === 'confirmar' ? 'reservas.editar' : 'reservas.cancelar';
  if (!tienePermiso(auth, permiso)) return json({ error: 'No tenés permiso para esta acción.' }, 403);
  try {
    const reserva = await cambiarEstadoReservaAdmin({
      reservaId: Number(params?.id),
      expectedVersion: Number(body.expected_version),
      accion,
      motivo: body.motivo,
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioGestionReservasAdmin(env.DB));
    return json({ data: reserva, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo cambiar el estado de la reserva.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.reservations.transition',
    contexto => cambiar(request, env, params, contexto.requestId)
  );
}
