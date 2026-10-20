import { consultarOperacionesMvp } from '../../../../_application/reservas/consultarOperacionesMvp.ts';
import { D1RepositorioOperacionesMvp } from '../../../../_infrastructure/d1/D1RepositorioOperacionesMvp.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

async function consultar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.outbox.leer');
  if (auth instanceof Response) return auth;
  const limite = Number(new URL(request.url).searchParams.get('limite') || 50);
  try {
    const estado = await consultarOperacionesMvp(new D1RepositorioOperacionesMvp(env.DB), limite);
    return json({
      data: estado,
      meta: {
        version: 'v1', contiene_pii: false,
        despacho_habilitado: String(env.INTEGRATION_OUTBOX_ENABLED || '').toLowerCase() === 'true',
        destino_configurado: typeof env.INTEGRATION_EVENTS_WEBHOOK_URL === 'string' &&
          env.INTEGRATION_EVENTS_WEBHOOK_URL.startsWith('https://') &&
          typeof env.INTEGRATION_EVENTS_WEBHOOK_SECRET === 'string' &&
          env.INTEGRATION_EVENTS_WEBHOOK_SECRET.trim().length >= 24,
      },
    });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo consultar el estado operativo.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.integrations.operations.read', () => consultar(request, env));
}
