// Cloudflare Pages Function — disponibilidad pública para el widget de
// reserva del sitio (Home / Estadía). Para cada día del rango pedido calcula
// si queda lugar en Domo (al menos 1 de los domos libre) y en Refugio (no
// se llegó al tope de camas), a partir de las reservas reales en D1 — el
// mismo dato que ya usa el Panel de Reservas, no una lista mantenida a mano.
//
// GET /api/disponibilidad?desde=YYYY-MM-DD&hasta=YYYY-MM-DD

import { consultarCalendarioDisponibilidad } from '../_application/reservas/consultarCalendarioDisponibilidad.ts';
import { D1RepositorioCalendarioDisponibilidad } from '../_infrastructure/d1/D1RepositorioCalendarioDisponibilidad.ts';
import { consumirLimite, respuestaLimite } from '../_interfaces/http/rateLimit.ts';
import { observarSolicitud, type ContextoObservabilidad } from '../_interfaces/http/observability.ts';

const ALLOWED_ORIGINS = ['https://experienciamagico.com'];
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) || LOCALHOST_ORIGIN.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function onRequestOptions({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request, env }: any) {
  return observarSolicitud(request, 'public.availability', contexto => consultar(request, env, contexto));
}

async function consultar(request: Request, env: any, contexto: ContextoObservabilidad) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.disponibilidad', 60, 60));
  if (limitada) {
    contexto.signal('rate_limit.rejected', 'warn', { metric: 'reservas_rate_limit_rejections_total' });
    return limitada;
  }
  const headers = corsHeaders(request);
  const url = new URL(request.url);
  const desde = url.searchParams.get('desde') || '';
  const hasta = url.searchParams.get('hasta') || '';

  const resultado = await consultarCalendarioDisponibilidad(
    desde,
    hasta,
    new D1RepositorioCalendarioDisponibilidad(env.DB)
  );

  if (resultado.ok === false) {
    contexto.signal('availability.invalid_range', 'warn', { metric: 'reservas_availability_rejections_total' });
    return json({ error: resultado.error.mensaje }, 400, headers);
  }

  return json(resultado.valor, 200, headers);
}
