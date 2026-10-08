import type { EstadoSolicitudArrepentimiento } from '../../../../_application/reservas/gestionarArrepentimientos.ts';
import { D1RepositorioSolicitudesArrepentimiento } from '../../../../_infrastructure/d1/D1RepositorioSolicitudesArrepentimiento.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

const ESTADOS = new Set(['recibida', 'en_revision', 'resuelta', 'rechazada']);

async function listar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'arrepentimientos.leer');
  if (auth instanceof Response) return auth;
  const estadoRaw = new URL(request.url).searchParams.get('estado');
  if (estadoRaw && !ESTADOS.has(estadoRaw)) return json({ error: 'Estado inválido.' }, 400);
  const items = await new D1RepositorioSolicitudesArrepentimiento(env.DB)
    .listar(estadoRaw as EstadoSolicitudArrepentimiento | null);
  return json({
    data: items.map(item => ({
      id: item.id,
      codigo: item.codigo,
      reserva_id: item.reservaId,
      reserva_codigo: item.reservaCodigoDeclarado,
      email: item.emailContacto,
      detalle: item.detalle,
      estado: item.estado,
      created_at: item.createdAt,
      acknowledged_at: item.acknowledgedAt,
      resolved_at: item.resolvedAt,
      resolved_by: item.resolvedBy,
      resolution_note: item.resolutionNote,
    })),
    meta: { version: 'v1', total: items.length },
  });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.withdrawal_requests.list', () => listar(request, env));
}
