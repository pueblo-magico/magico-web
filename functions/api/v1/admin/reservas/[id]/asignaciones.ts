import {
  asignarInventarioReserva,
  liberarInventarioReserva,
} from '../../../../../_application/reservas/gestionarAsignacionInventario.ts';
import { D1RepositorioAsignacionInventario } from '../../../../../_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { observarSolicitud } from '../../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../../../_lib/authGuard.ts';
import type { ModalidadAlojamiento } from '../../../../../_domain/reservas/accommodationInventory.ts';

async function bodySeguro(request: Request): Promise<Record<string, unknown> | Response> {
  try {
    return await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
}

async function asignar(request: Request, env: any, params: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.asignar');
  if (auth instanceof Response) return auth;
  const body = await bodySeguro(request);
  if (body instanceof Response) return body;
  try {
    const asignacion = await asignarInventarioReserva({
      reservaId: Number(params?.id),
      expectedVersion: Number(body.expected_version),
      espacioCodigo: String(body.espacio_codigo || ''),
      modalidad: body.modalidad as ModalidadAlojamiento,
      unidadesCodigos: Array.isArray(body.unidades_codigos)
        ? body.unidades_codigos.map(String)
        : [],
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioAsignacionInventario(env.DB));
    return json({ data: asignacion, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo asignar el inventario.', status: 500,
    });
  }
}

async function consultar(request: Request, env: any, params: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.leer');
  if (auth instanceof Response) return auth;
  const reservaId = Number(params?.id);
  if (!Number.isSafeInteger(reservaId) || reservaId < 1) {
    return json({ error: 'La reserva es inválida.', codigo: 'DATOS_INVALIDOS' }, 400);
  }
  const asignacion = await new D1RepositorioAsignacionInventario(env.DB).obtenerActual(reservaId);
  if (!asignacion) return json({ error: 'La reserva no existe.', codigo: 'RESERVA_NO_ENCONTRADA' }, 404);
  return json({ data: asignacion, meta: { version: 'v1' } });
}

async function liberar(request: Request, env: any, params: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.asignar');
  if (auth instanceof Response) return auth;
  const body = await bodySeguro(request);
  if (body instanceof Response) return body;
  try {
    const asignacion = await liberarInventarioReserva({
      reservaId: Number(params?.id),
      expectedVersion: Number(body.expected_version),
      actorEmail: auth.email,
      correlationId,
    }, new D1RepositorioAsignacionInventario(env.DB));
    return json({ data: asignacion, meta: { version: 'v1' } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo liberar el inventario.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.inventory_assignment.read', () => consultar(request, env, params));
}

export async function onRequestPost({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.inventory_assignment.replace',
    contexto => asignar(request, env, params, contexto.requestId)
  );
}

export async function onRequestDelete({ request, env, params }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.inventory_assignment.release',
    contexto => liberar(request, env, params, contexto.requestId)
  );
}
