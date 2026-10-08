import { procesarCollectionCucuru } from '../../../../_application/reservas/procesarCollectionCucuru.ts';
import { ErrorReserva } from '../../../../_domain/reservas/errors.ts';
import {
  ErrorCucuruContrato,
  normalizarCollectionCucuru,
} from '../../../../_infrastructure/cucuru/CucuruProveedorCuentasCobro.ts';
import { D1RepositorioConciliacionCucuru } from '../../../../_infrastructure/d1/D1RepositorioConciliacionCucuru.ts';
import { observarSolicitud, type ContextoObservabilidad } from '../../../../_interfaces/http/observability.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';

const HEADER_DEFAULT = 'X-Cucuru-Webhook-Secret';
const HEADER_SEGURO = /^[A-Za-z0-9-]{1,64}$/;

function igualesConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

function esPruebaImporteCero(payload: Record<string, unknown>): boolean {
  const importe = payload.amount;
  if (typeof importe === 'number') return Number.isFinite(importe) && importe === 0;
  if (typeof importe !== 'string') return false;
  return /^0+(?:\.0+)?$/.test(importe.trim());
}

export function autenticarWebhookCucuru(request: Request, env: Record<string, unknown>): boolean {
  const secreto = env.CUCURU_WEBHOOK_SECRET;
  const configurado = typeof env.CUCURU_WEBHOOK_HEADER_NAME === 'string'
    ? env.CUCURU_WEBHOOK_HEADER_NAME.trim()
    : HEADER_DEFAULT;
  if (typeof secreto !== 'string' || secreto.length < 24 || !HEADER_SEGURO.test(configurado)) return false;
  const recibido = request.headers.get(configurado);
  return typeof recibido === 'string' && igualesConstante(recibido, secreto);
}

export async function onRequestPost({ request, env }: any) {
  return observarSolicitud(
    request,
    'integration.cucuru.collection_received',
    contexto => ejecutar(request, env, contexto)
  );
}

async function ejecutar(request: Request, env: any, contexto: ContextoObservabilidad): Promise<Response> {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'webhook.cucuru', 120, 60));
  if (limitada) {
    contexto.signal('rate_limit.rejected', 'warn', { metric: 'reservas_rate_limit_rejections_total' });
    return limitada;
  }
  if (!autenticarWebhookCucuru(request, env)) {
    contexto.signal('payment.webhook_rejected', 'warn', { metric: 'reservas_webhook_rejections_total' });
    return json({ error: 'No autorizado.' }, 401);
  }
  if (typeof env.CUCURU_COLLECTOR_ID !== 'string' || !env.CUCURU_COLLECTOR_ID.trim()) {
    contexto.signal('payment.webhook_configuration_error', 'error', { metric: 'reservas_webhook_errors_total' });
    return json({ error: 'Integración no configurada.' }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await leerJsonSeguro(request);
  } catch (error) {
    contexto.signal('payment.webhook_rejected', 'warn', { metric: 'reservas_webhook_rejections_total' });
    return respuestaJsonInvalido(error);
  }

  // Cucuru valida un webhook nuevo con una notificación autenticada de importe cero.
  // Esa prueba no garantiza todos los campos de una Collection real, por lo que se
  // confirma sin escribir datos de reservas.
  if (esPruebaImporteCero(payload)) {
    contexto.signal('payment.webhook_processed', 'info', {
      outcome: 'prueba_cero',
      metric: 'reservas_webhooks_processed_total',
    });
    return json({ ok: true, estado: 'prueba_cero' }, 200);
  }

  try {
    const collection = await normalizarCollectionCucuru(payload);
    contexto.setEventId(collection.collectionId);
    const resultado = await procesarCollectionCucuru(
      collection,
      env.CUCURU_COLLECTOR_ID.trim(),
      new D1RepositorioConciliacionCucuru(env.DB),
      contexto.requestId
    );
    contexto.signal('payment.webhook_processed', 'info', {
      outcome: resultado.estado,
      metric: 'reservas_webhooks_processed_total',
    });
    return json({ ok: true, estado: resultado.estado }, 200);
  } catch (error) {
    if (error instanceof ErrorCucuruContrato || error instanceof ErrorReserva) {
      contexto.signal('payment.webhook_rejected', 'warn', { metric: 'reservas_webhook_rejections_total' });
      return json({ error: 'Collection inválida.' }, 400);
    }
    contexto.signal('payment.webhook_processing_failed', 'error', { metric: 'reservas_webhook_errors_total' });
    return json({ error: 'Procesamiento temporalmente no disponible.' }, 503);
  }
}
