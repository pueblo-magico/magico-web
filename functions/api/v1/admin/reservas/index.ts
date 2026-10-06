import { listarReservasAdmin } from '../../../../_application/reservas/consultarReservasAdmin.ts';
import { crearReservaAdmin } from '../../../../_application/reservas/gestionarReservasAdmin.ts';
import { D1RepositorioGestionReservasAdmin } from '../../../../_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../../_interfaces/http/requestSecurity.ts';
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

async function crear(request: Request, env: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.crear');
  if (auth instanceof Response) return auth;
  let body: Record<string, any>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  try {
    const reserva = await crearReservaAdmin({
      clienteNombre: body.cliente_nombre,
      clienteTelefono: body.cliente_telefono ?? null,
      clienteEmail: body.cliente_email ?? null,
      fechaCheckin: body.fecha_checkin,
      fechaCheckout: body.fecha_checkout,
      cantidadPersonas: Number(body.cantidad_personas),
      espacioCodigo: body.espacio_codigo,
      modalidad: body.modalidad,
      canalOrigen: body.canal_origen || 'Admin',
      montoTotalCentavos: Number(body.monto_total_centavos),
      montoSenaCentavos: body.monto_sena_centavos == null ? null : Number(body.monto_sena_centavos),
    }, auth.email, correlationId, new D1RepositorioGestionReservasAdmin(env.DB));
    return json({ data: reserva, meta: { version: 'v1' } }, 201);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo crear la reserva.', status: 500,
    });
  }
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request, 'admin.reservations.create',
    contexto => crear(request, env, contexto.requestId)
  );
}
