import { despacharEventosIntegracion } from '../../../../_application/reservas/despacharEventosIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import {
  ErrorConfiguracionEntregaIntegracion,
  HttpEntregadorEventosIntegracion,
} from '../../../../_infrastructure/integrations/HttpEntregadorEventosIntegracion.ts';
import {
  observarSolicitud,
  type ContextoObservabilidad,
} from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { autenticarServicio } from '../../../../_interfaces/http/serviceAuth.ts';

function habilitado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().toLowerCase() === 'true';
}

async function despachar(
  request: Request,
  env: Record<string, any>,
  signal: ContextoObservabilidad['signal']
): Promise<Response> {
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('outbox', secreto, env, 'integraciones:despachar')) {
    return json({ error: 'No autorizado.' }, 401);
  }
  if (!habilitado(env.INTEGRATION_OUTBOX_ENABLED)) {
    return json({ error: 'El despacho de integraciones está desactivado.' }, 409);
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
    const conFallas = resultado.reprogramados > 0 || resultado.deadLetter > 0;
    signal('outbox.batch_dispatched', conFallas ? 'warn' : 'info', {
      outcome: resultado.deadLetter > 0
        ? 'dead_letter'
        : resultado.reprogramados > 0
          ? 'retry_scheduled'
          : resultado.reclamados > 0
            ? 'delivered'
            : 'noop',
      metric: 'reservas_outbox_dispatch_runs_total',
    });
    return json({ ok: true, ...resultado });
  } catch (error) {
    const configuracion = error instanceof ErrorConfiguracionEntregaIntegracion;
    signal('outbox.dispatch_failed', configuracion ? 'warn' : 'error', {
      outcome: configuracion ? 'configuration_error' : 'retryable',
      metric: 'reservas_outbox_dispatch_errors_total',
    });
    return json({
      error: configuracion
        ? 'La entrega de integraciones no está configurada.'
        : 'No se pudo ejecutar el despacho de integraciones.',
    }, configuracion ? 409 : 503);
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request, 'integration.outbox.dispatch',
    contexto => despachar(request, env, contexto.signal),
    env?.OBSERVABILITY_LOGGER || console
  );
}
