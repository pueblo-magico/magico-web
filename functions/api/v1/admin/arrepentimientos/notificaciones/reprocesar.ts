import { reprocesarNotificacionArrepentimiento } from '../../../../../_application/reservas/gestionarNotificacionesArrepentimiento.ts';
import { D1RegistroAuditoriaReservas } from '../../../../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioNotificacionesArrepentimiento } from '../../../../../_infrastructure/d1/D1RepositorioNotificacionesArrepentimiento.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function reprocesar(request: Request, env: any, requestId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'arrepentimientos.gestionar');
  if (auth instanceof Response) return auth;
  let body: Record<string, any>;
  try { body = await leerJsonSeguro(request); } catch (error) { return respuestaJsonInvalido(error); }
  try {
    const actualizado = await reprocesarNotificacionArrepentimiento({
      notificacionUid: String(body.notificacion_uid || ''),
      motivo: String(body.motivo || ''),
      actorEmail: auth.email,
      correlationId: requestId,
    }, new D1RepositorioNotificacionesArrepentimiento(env.DB), new D1RegistroAuditoriaReservas(env.DB));
    if (!actualizado) return json({ error: 'La notificación no admite reproceso.' }, 409);
    return json({ ok: true, estado: 'pendiente' });
  } catch (error: any) {
    if (error?.codigo === 'DATOS_INVALIDOS') return json({ error: 'La solicitud de reproceso es inválida.' }, 400);
    throw error;
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.withdrawal_notifications.reprocess', contexto => reprocesar(request, env, contexto.requestId));
}
