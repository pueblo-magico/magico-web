import { destinatariosAviso, enviarMail, tablaHtml } from '../../../_lib/formularios.ts';
import {
  autenticarWebhookCucuru,
  ErrorCucuruContrato,
  esPruebaImporteCero,
  normalizarCollectionCucuru,
  procesarAporteCucuru,
  type CollectionCucuru,
} from '../../../_lib/cucuruDonations.ts';

const MAX_BODY_BYTES = 32_000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function notificarEquipo(env: any, collection: CollectionCucuru, aporteId: number | null): Promise<void> {
  const recipients = destinatariosAviso(env);
  if (recipients.length === 0) return;
  const amount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: collection.currency,
  }).format(collection.amountCents / 100);
  const sent = await enviarMail(
    env,
    recipients,
    `Nuevo aporte de reforestación · ${amount}`,
    `<p>Se confirmó automáticamente un aporte recibido por Cucuru.</p>` +
      tablaHtml({
        Aporte: aporteId == null ? '—' : `#${aporteId}`,
        Importe: amount,
        Fecha: collection.occurredAt,
        Collection: collection.collectionId,
        Referencia: collection.customerId || '—',
      }) +
      `<p style="color:#888;font-size:12px">El evento fue validado, deduplicado y registrado sin conservar el payload completo de Cucuru.</p>`,
  );
  if (aporteId != null) {
    await env.DB.prepare(`
      UPDATE reforestacion_aportes
      SET notification_status = ?, notification_attempted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND notification_status = 'pendiente'
    `).bind(sent ? 'enviada' : 'fallida', aporteId).run();
  }
}

async function execute(request: Request, env: any, waitUntil?: (promise: Promise<unknown>) => void): Promise<Response> {
  if (!autenticarWebhookCucuru(request, env)) {
    console.warn('cucuru-webhook: autenticación rechazada');
    return json({ error: 'No autorizado.' }, 401);
  }
  if (!env.DB || typeof env.CUCURU_COLLECTOR_ID !== 'string' || !env.CUCURU_COLLECTOR_ID.trim()) {
    console.error('cucuru-webhook: integración incompleta');
    return json({ error: 'Integración no configurada.' }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ error: 'Payload demasiado grande.' }, 413);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'Se esperaba un objeto JSON válido.' }, 400);
  }

  // Cucuru utiliza un evento autenticado de importe cero al validar una URL.
  // No lo tratamos como aporte ni escribimos datos financieros.
  if (esPruebaImporteCero(payload)) {
    return json({ ok: true, estado: 'prueba_cero' });
  }

  const providerStatus = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : null;
  if (providerStatus === 'rejected') {
    return json({ ok: true, estado: 'ignorado', motivo: 'COLLECTION_RECHAZADA' });
  }
  if (providerStatus != null && providerStatus !== 'received' && providerStatus !== 'settlement') {
    return json({ error: 'Estado de Collection desconocido.' }, 400);
  }

  try {
    const collection = await normalizarCollectionCucuru(payload);
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    const result = await procesarAporteCucuru(env.DB, collection, env, requestId);
    if (result.estado === 'aplicado') {
      const notification = notificarEquipo(env, collection, result.aporteId).catch(error => {
        console.error('cucuru-webhook: falló la notificación interna', error);
      });
      if (typeof waitUntil === 'function') waitUntil(notification);
      else await notification;
    }
    return json({ ok: true, estado: result.estado, motivo: result.motivo });
  } catch (error) {
    if (error instanceof ErrorCucuruContrato) {
      console.warn('cucuru-webhook: Collection inválida', error.message);
      return json({ error: 'Collection inválida.' }, 400);
    }
    console.error('cucuru-webhook: error temporal', error);
    return json({ error: 'Procesamiento temporalmente no disponible.' }, 503);
  }
}

export async function onRequestPost({ request, env, waitUntil }: any): Promise<Response> {
  return execute(request, env, waitUntil);
}

export async function onRequestGet(): Promise<Response> {
  return json({ error: 'Método no permitido.' }, 405);
}

export { execute as procesarWebhookCucuru };
