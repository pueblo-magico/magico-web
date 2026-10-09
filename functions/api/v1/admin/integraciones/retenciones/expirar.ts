import { expirarRetenciones } from '../../../../../_application/reservas/expirarRetenciones.ts';
import { D1RegistroAuditoriaReservas } from '../../../../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioRetencionesReserva } from '../../../../../_infrastructure/d1/D1RepositorioRetencionesReserva.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function expirar(request: Request, env: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.retenciones.expirar');
  if (auth instanceof Response) return auth;

  try {
    const resultado = await expirarRetenciones(new D1RepositorioRetencionesReserva(env.DB));
    await new D1RegistroAuditoriaReservas(env.DB).registrar({
      email: auth.email,
      accion: 'expirar_retenciones_manual',
      entidadTipo: 'retenciones_reserva',
      correlationId,
      metadata: { expiradas: resultado.expiradas },
    });
    return json({ data: { expiradas: resultado.expiradas }, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudieron liberar las retenciones vencidas.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.reservations.expire_holds',
    async contexto => {
      const response = await expirar(request, env, contexto.requestId);
      if (response.ok) {
        const body = await response.clone().json() as { data?: { expiradas?: number } };
        contexto.signal('reservation.holds_expired', 'info', {
          outcome: Number(body.data?.expiradas || 0) > 0 ? 'expired' : 'noop',
          metric: 'reservas_holds_expiration_runs_total',
        });
      } else if (response.status >= 500) {
        contexto.signal('reservation.hold_expiration_failed', 'error', {
          outcome: 'retryable', metric: 'reservas_holds_expiration_errors_total',
        });
      }
      return response;
    }
  );
}
