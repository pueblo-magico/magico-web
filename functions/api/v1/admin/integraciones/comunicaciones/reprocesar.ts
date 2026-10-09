import { reprocesarIntencionComunicacion } from '../../../../../_application/reservas/gestionarIntencionesComunicacion.ts';
import { D1RepositorioIntencionesComunicacion } from '../../../../../_infrastructure/d1/D1RepositorioIntencionesComunicacion.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function reprocesar(request: Request, env: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.outbox.reprocesar');
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  try {
    const actualizado = await reprocesarIntencionComunicacion({
      intencionUid: String(body.intencion_uid || ''),
      motivo: String(body.motivo || ''),
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioIntencionesComunicacion(env.DB));
    if (!actualizado) return json({ error: 'La intención no admite reproceso.' }, 409);
    return json({ ok: true, intencion_uid: String(body.intencion_uid).trim(), estado: 'pendiente' });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo reprocesar la comunicación.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.integrations.communications.reprocess',
    contexto => reprocesar(request, env, contexto.requestId)
  );
}
