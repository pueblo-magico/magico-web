import { consultarReservaAdmin } from '../../../../../_application/reservas/consultarReservasAdmin.ts';
import { D1RepositorioAsignacionInventario } from '../../../../../_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { D1RepositorioGestionReservasAdmin } from '../../../../../_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { D1RepositorioHistorialReserva } from '../../../../../_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';

async function consultar(request: Request, env: any, params: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;
  try {
    const detalle = await consultarReservaAdmin(
      Number(params?.id),
      new D1RepositorioGestionReservasAdmin(env.DB),
      new D1RepositorioHistorialReserva(env.DB),
      new D1RepositorioAsignacionInventario(env.DB)
    );
    return json({ data: detalle, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo consultar la reserva.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.reservations.detail', () => consultar(request, env, params));
}
