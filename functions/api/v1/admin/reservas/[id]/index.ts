import { consultarReservaAdmin } from '../../../../../_application/reservas/consultarReservasAdmin.ts';
import { editarReservaAdmin } from '../../../../../_application/reservas/gestionarReservasAdmin.ts';
import { D1RepositorioAsignacionInventario } from '../../../../../_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { D1RepositorioGestionReservasAdmin } from '../../../../../_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { D1RepositorioHistorialReserva } from '../../../../../_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
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

async function editar(
  request: Request, env: any, params: any, correlationId: string
): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.editar');
  if (auth instanceof Response) return auth;
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  try {
    const cambios = body.cambios || {};
    const reserva = await editarReservaAdmin({
      reservaId: Number(params?.id),
      expectedVersion: Number(body.expected_version),
      cambios: {
        ...(Object.hasOwn(cambios, 'cliente_nombre') ? { clienteNombre: cambios.cliente_nombre } : {}),
        ...(Object.hasOwn(cambios, 'cliente_telefono') ? { clienteTelefono: cambios.cliente_telefono } : {}),
        ...(Object.hasOwn(cambios, 'cliente_email') ? { clienteEmail: cambios.cliente_email } : {}),
        ...(Object.hasOwn(cambios, 'canal_origen') ? { canalOrigen: cambios.canal_origen } : {}),
      },
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioGestionReservasAdmin(env.DB));
    return json({ data: reserva, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo editar la reserva.', status: 500,
    });
  }
}

export async function onRequestPatch({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.reservations.update',
    contexto => editar(request, env, params, contexto.requestId)
  );
}
