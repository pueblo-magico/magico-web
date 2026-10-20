import { reprocesarEventoOutbox } from '../../../../../_application/reservas/gestionarOutboxIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../../../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function reprocesar(
  request: Request, env: any, correlationId: string
): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.outbox.reprocesar');
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  try {
    const actualizado = await reprocesarEventoOutbox({
      eventId: String(body.event_id || ''),
      motivo: String(body.motivo || ''),
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioOutboxIntegracion(env.DB));
    if (!actualizado) {
      return json({ error: 'El evento no existe o no está en dead letter.' }, 409);
    }
    return json({ ok: true, event_id: String(body.event_id).trim(), estado: 'pending' });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo reprocesar el evento.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.integrations.outbox.reprocess',
    contexto => reprocesar(request, env, contexto.requestId)
  );
}
