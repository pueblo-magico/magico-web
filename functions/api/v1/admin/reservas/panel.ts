import { consultarPanelReservas } from '../../../../_application/reservas/consultarPanelReservas.ts';
import { D1RepositorioPanelReservas } from '../../../../_infrastructure/d1/D1RepositorioPanelReservas.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { jsonReserva as json } from '../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../_lib/authGuard.ts';

async function consultar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;
  const panel = await consultarPanelReservas('operativa', new D1RepositorioPanelReservas(env.DB));
  return json({
    data: { alojamientos: panel.alojamientos, metricas: panel.metricas },
    meta: { version: 'v1' },
  });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.reservations.panel', () => consultar(request, env));
}
