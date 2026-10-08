import { despacharEventosIntegracion } from '../../../../../_application/reservas/despacharEventosIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../../../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import {
  ErrorConfiguracionEntregaIntegracion,
  HttpEntregadorEventosIntegracion,
} from '../../../../../_infrastructure/integrations/HttpEntregadorEventosIntegracion.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { jsonReserva as json } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

function habilitado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().toLowerCase() === 'true';
}

async function despachar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.outbox.despachar');
  if (auth instanceof Response) return auth;
  if (!habilitado(env.INTEGRATION_OUTBOX_ENABLED)) {
    return json({ error: 'La entrega de eventos está desactivada en este ambiente.' }, 409);
  }
  try {
    const resultado = await despacharEventosIntegracion(
      new D1RepositorioOutboxIntegracion(env.DB),
      new HttpEntregadorEventosIntegracion({
        url: env.INTEGRATION_EVENTS_WEBHOOK_URL,
        secret: env.INTEGRATION_EVENTS_WEBHOOK_SECRET,
      }),
      { consumer: 'integration_webhook' }
    );
    return json({ data: resultado, meta: { version: 'v1' } });
  } catch (error) {
    const configuracion = error instanceof ErrorConfiguracionEntregaIntegracion;
    return json({
      error: configuracion
        ? 'El destino de integración no está configurado.'
        : 'No se pudo procesar la cola de eventos.',
    }, configuracion ? 409 : 503);
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.integrations.outbox.dispatch',
    () => despachar(request, env)
  );
}
