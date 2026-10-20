import { programarRecordatoriosLlegadaEquipo } from '../../../../_application/reservas/programarRecordatoriosLlegadaEquipo.ts';
import { D1RepositorioRecordatoriosLlegadaEquipo } from '../../../../_infrastructure/d1/D1RepositorioRecordatoriosLlegadaEquipo.ts';
import { registrarUsoAplicacionApi } from '../../../../_infrastructure/d1/D1RegistroUsoAplicacionApi.ts';
import { programarDespachoOutbox } from '../../../../_interfaces/http/backgroundOutboxDispatch.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { autenticarServicio } from '../../../../_interfaces/http/serviceAuth.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';

async function programar(
  request: Request,
  env: Record<string, any>,
  waitUntil?: (promise: Promise<unknown>) => void
): Promise<Response> {
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('n8n', secreto, env, 'reservas:recordar_llegadas')) {
    return json({ error: 'No autorizado.' }, 401);
  }
  await registrarUsoAplicacionApi(
    env.DB,
    'n8n',
    request.method,
    '/api/v1/integrations/reservas/programar-recordatorios-llegada'
  );
  try {
    const resultado = await programarRecordatoriosLlegadaEquipo({
      diasAnticipacion: env.RESERVATION_ARRIVAL_REMINDER_DAYS,
    }, new D1RepositorioRecordatoriosLlegadaEquipo(env.DB));
    if (resultado.eventIds.length > 0) {
      programarDespachoOutbox(
        env,
        waitUntil,
        'integration.reservations.arrival_reminders',
        { eventIds: resultado.eventIds }
      );
    }
    return json({
      ok: true,
      programadas: resultado.programadas,
      fecha_objetivo: resultado.fechaObjetivo,
      dias_anticipacion: resultado.diasAnticipacion,
    });
  } catch {
    return json({ error: 'No se pudieron programar los recordatorios de llegada.' }, 503);
  }
}

export async function onRequestPost({ request, env, waitUntil }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'integration.reservations.schedule_arrival_reminders',
    () => programar(request, env, waitUntil),
    env?.OBSERVABILITY_LOGGER || console
  );
}
