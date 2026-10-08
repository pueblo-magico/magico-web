import {
  resolverSolicitudArrepentimiento,
  type EstadoSolicitudArrepentimiento,
} from '../../../../_application/reservas/gestionarArrepentimientos.ts';
import { D1RegistroAuditoriaReservas } from '../../../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioSolicitudesArrepentimiento } from '../../../../_infrastructure/d1/D1RepositorioSolicitudesArrepentimiento.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

const ESTADOS = new Set(['recibida', 'en_revision', 'resuelta', 'rechazada']);

async function actualizar(request: Request, env: any, params: any, requestId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'arrepentimientos.gestionar');
  if (auth instanceof Response) return auth;
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  const id = Number(params.id);
  const estado = String(body.estado || '') as EstadoSolicitudArrepentimiento;
  const estadoActual = String(body.estado_actual || '') as EstadoSolicitudArrepentimiento;
  if (!ESTADOS.has(estado) || !ESTADOS.has(estadoActual)) return json({ error: 'Estado inválido.' }, 400);
  try {
    const item = await resolverSolicitudArrepentimiento({
      id,
      estadoActual,
      estado,
      actorEmail: auth.email,
      motivo: String(body.motivo || ''),
      correlationId: requestId,
    }, new D1RepositorioSolicitudesArrepentimiento(env.DB), new D1RegistroAuditoriaReservas(env.DB));
    if (!item) return json({ error: 'La solicitud cambió o ya fue resuelta.' }, 409);
    return json({ data: { id: item.id, codigo: item.codigo, estado: item.estado }, meta: { version: 'v1' } });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : '';
    if (codigo === 'DATOS_INVALIDOS' || codigo === 'TRANSICION_INVALIDA') {
      return json({ error: 'Los datos o la transición no son válidos.' }, 400);
    }
    throw error;
  }
}

export async function onRequestPatch({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.withdrawal_requests.update',
    contexto => actualizar(request, env, params, contexto.requestId)
  );
}
