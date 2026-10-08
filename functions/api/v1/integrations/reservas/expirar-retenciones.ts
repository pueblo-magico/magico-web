import { expirarRetenciones } from '../../../../_application/reservas/expirarRetenciones.ts';
import { D1RepositorioRetencionesReserva } from '../../../../_infrastructure/d1/D1RepositorioRetencionesReserva.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { autenticarServicio } from '../../../../_interfaces/http/serviceAuth.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';

async function expirar(request: Request, env: Record<string, any>): Promise<Response> {
  const secreto = request.headers.get('X-Service-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('n8n', secreto, env, 'reservas:expirar')) {
    return json({ error: 'No autorizado.' }, 401);
  }

  try {
    const resultado = await expirarRetenciones(new D1RepositorioRetencionesReserva(env.DB));
    return json({ ok: true, expiradas: resultado.expiradas }, 200);
  } catch {
    return json({ error: 'No se pudieron vencer las retenciones.' }, 503);
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'integration.reservations.expire_holds',
    async contexto => {
      const response = await expirar(request, env);
      if (response.ok) {
        const body = await response.clone().json() as { expiradas?: number };
        contexto.signal('reservation.holds_expired', 'info', {
          outcome: Number(body.expiradas || 0) > 0 ? 'expired' : 'noop',
          metric: 'reservas_holds_expiration_runs_total',
        });
      } else if (response.status >= 500) {
        contexto.signal('reservation.hold_expiration_failed', 'error', {
          outcome: 'retryable',
          metric: 'reservas_holds_expiration_errors_total',
        });
      }
      return response;
    },
    env?.OBSERVABILITY_LOGGER || console
  );
}
