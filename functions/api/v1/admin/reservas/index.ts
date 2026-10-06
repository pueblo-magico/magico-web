import { listarReservasAdmin } from '../../../../_application/reservas/consultarReservasAdmin.ts';
import { D1RepositorioGestionReservasAdmin } from '../../../../_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

async function listar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;
  const params = new URL(request.url).searchParams;
  try {
    const pagina = await listarReservasAdmin({
      pagina: Number(params.get('pagina') || 1),
      limite: Number(params.get('limite') || 25),
      fechaDesde: params.get('fecha_desde'),
      fechaHasta: params.get('fecha_hasta'),
      estado: params.get('estado'),
      origen: params.get('origen'),
      espacioCodigo: params.get('espacio'),
      titular: params.get('titular'),
    }, new D1RepositorioGestionReservasAdmin(env.DB));
    return json({ data: pagina.items, meta: {
      version: 'v1', pagina: pagina.pagina, limite: pagina.limite,
      total: pagina.total, total_paginas: pagina.totalPaginas,
    } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudieron listar las reservas.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.reservations.list', () => listar(request, env));
}
