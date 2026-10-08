import { consultarEstadoOutbox } from '../../../../../_application/reservas/gestionarOutboxIntegracion.ts';
import { D1RepositorioOutboxIntegracion } from '../../../../../_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function consultar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'integraciones.outbox.leer');
  if (auth instanceof Response) return auth;
  const limite = Number(new URL(request.url).searchParams.get('limite') || 100);
  try {
    const estado = await consultarEstadoOutbox(
      new D1RepositorioOutboxIntegracion(env.DB), limite
    );
    return json({ data: estado, meta: { version: 'v1', contiene_pii: false } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo consultar el outbox.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.integrations.outbox.read', () => consultar(request, env));
}
