// Cloudflare Pages Function — webhook de Mercado Pago. Valida la firma HMAC,
// confirma el pago contra la API de MP (nunca confiamos en el body a ciegas),
// marca la reserva 'confirmada' en D1. La comunicación se genera como intención
// durable e independiente del canal mediante los eventos de dominio.
//
// Requiere estas variables de entorno en Cloudflare Pages:
//   MP_ACCESS_TOKEN               — access token de Mercado Pago (para GET /v1/payments/:id)
//   MP_WEBHOOK_SECRET             — "Clave secreta" de la notificación webhook (MP > Tus integraciones > Webhooks)
//
// IMPORTANTE — esto no se pudo probar contra un webhook real de Mercado Pago
// (no hay credenciales de test en este entorno). El esquema de x-signature
// sigue la documentación oficial de MP al momento de escribir esto, pero
// verificalo con el simulador de webhooks de MP o un pago de prueba real
// antes de confiar en esto en producción.

import { procesarPagoMercadoPago } from '../_application/reservas/procesarPagoMercadoPago.ts';
import { D1RepositorioEstadoPagoReserva } from '../_infrastructure/d1/D1RepositorioEstadoPagoReserva.ts';
import { MercadoPagoProveedorPagos } from '../_infrastructure/mercadopago/MercadoPagoProveedorPagos.ts';
import { ErrorProveedorPagosTransitorio } from '../_infrastructure/mercadopago/MercadoPagoProveedorPagos.ts';
import { consumirLimite, respuestaLimite } from '../_interfaces/http/rateLimit.ts';
import { observarSolicitud, type ContextoObservabilidad } from '../_interfaces/http/observability.ts';

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Comparación en tiempo constante — un `===` filtraría por timing dónde
// diverge el hash, lo que en teoría permite reconstruir una firma válida
// byte a byte contra un endpoint público.
function hashesIguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/your-integrations/notifications/webhooks#editor_10
async function firmaValida(request: Request, env: any): Promise<{ ok: boolean; dataId: string | null }> {
  const url = new URL(request.url);
  const dataId = url.searchParams.get('data.id');
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');

  if (!dataId || !xSignature || !xRequestId || !env.MP_WEBHOOK_SECRET) {
    return { ok: false, dataId };
  }

  const parts: Record<string, string> = {};
  for (const chunk of xSignature.split(',')) {
    const [k, v] = chunk.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  }
  const { ts, v1 } = parts;
  if (!ts || !v1) return { ok: false, dataId };

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const hash = await hmacSha256Hex(env.MP_WEBHOOK_SECRET, manifest);

  return { ok: hashesIguales(hash, v1), dataId };
}

export async function onRequestPost({ request, env }: any) {
  return observarSolicitud(request, 'integration.mercadopago.webhook', contexto => ejecutar(request, env, contexto));
}

async function ejecutar(request: Request, env: any, contexto: ContextoObservabilidad) {
  contexto.setEventId(request.headers.get('x-request-id'));
  const limitada = respuestaLimite(await consumirLimite(request, env, 'webhook.mercadopago', 120, 60));
  if (limitada) {
    contexto.signal('rate_limit.rejected', 'warn', { metric: 'reservas_rate_limit_rejections_total' });
    return limitada;
  }
  // Una firma inválida se rechaza sin procesar. Las inconsistencias comerciales
  // se registran y responden 200, mientras que una falla técnica responde 503
  // para que Mercado Pago pueda reintentar el procesamiento idempotente.
  const { ok: firmaOk, dataId } = await firmaValida(request, env);
  if (!firmaOk || !dataId) {
    contexto.signal('payment.webhook_rejected', 'warn', { metric: 'reservas_webhook_rejections_total' });
    return new Response('Firma inválida', { status: 401 });
  }

  try {
    await procesarPagoMercadoPago(
      dataId,
      new MercadoPagoProveedorPagos(env.MP_ACCESS_TOKEN),
      new D1RepositorioEstadoPagoReserva(env.DB),
      request.headers.get('x-request-id') || `payment:${dataId}`,
      contexto.requestId
    );

    contexto.signal('payment.webhook_processed', 'info', { metric: 'reservas_webhooks_processed_total' });

    return new Response('OK', { status: 200 });
  } catch (error) {
    contexto.signal('payment.webhook_processing_failed', 'error', { metric: 'reservas_webhook_errors_total' });
    const mensaje = error instanceof ErrorProveedorPagosTransitorio
      ? 'Proveedor temporalmente no disponible'
      : 'Procesamiento temporalmente no disponible';
    return new Response(mensaje, { status: 503 });
  }
}
