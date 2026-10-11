import {
  actualizarModalidadConfiguracion,
  actualizarParametroConfiguracion,
  consultarConfiguracionBase,
  publicarTarifaAlimentacionConfiguracion,
} from '../../../_application/reservas/gestionarConfiguracionBase.ts';
import { D1RepositorioConfiguracionBaseReservas } from '../../../_infrastructure/d1/D1RepositorioConfiguracionBaseReservas.ts';
import { observarSolicitud } from '../../../_interfaces/http/observability.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../../_interfaces/http/requestSecurity.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../../_interfaces/http/reservasHttp.ts';
import { requirePermission } from '../../../_lib/authGuard.ts';

async function consultar(request: Request, env: any): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.configuracion.leer');
  if (auth instanceof Response) return auth;
  try {
    const configuracion = await consultarConfiguracionBase(new D1RepositorioConfiguracionBaseReservas(env.DB));
    return json({ data: configuracion, meta: { version: 'v1', contiene_secretos: false } });
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo consultar la configuración.', status: 500,
    });
  }
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'admin.reservations.configuration.read', () => consultar(request, env));
}

async function actualizar(request: Request, env: any, correlationId: string): Promise<Response> {
  const auth = await requirePermission(request, env, 'reservas.configuracion.gestionar');
  if (auth instanceof Response) return auth;
  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }
  try {
    const repositorio = new D1RepositorioConfiguracionBaseReservas(env.DB);
    const accion = String(body.accion || 'actualizar_parametro');
    if (accion === 'actualizar_parametro') {
      const parametro = await actualizarParametroConfiguracion({
        codigo: String(body.codigo || '') as 'payment_hold_minutes',
        valor: Number(body.valor), expectedVersion: Number(body.expected_version),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: parametro, meta: { version: 'v1' } });
    }
    if (accion === 'actualizar_modalidad') {
      const modalidad = await actualizarModalidadConfiguracion({
        id: Number(body.id), habilitada: body.habilitada === true,
        expectedHabilitada: body.expected_habilitada === true,
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: modalidad, meta: { version: 'v1' } });
    }
    if (accion === 'publicar_tarifa_alimentacion') {
      const tarifa = await publicarTarifaAlimentacionConfiguracion({
        codigo: String(body.codigo || '') as 'desayuno_incluido' | 'pension_completa',
        precioComidaCentavos: Number(body.precio_comida_centavos),
        expectedVersion: Number(body.expected_version), motivo: String(body.motivo || ''),
        actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: tarifa, meta: { version: 'v1' } });
    }
    return json({ error: 'Acción de configuración no soportada.' }, 400);
  } catch (error) {
    return respuestaErrorReserva(error, {
      codigo: 'ERROR_INTERNO', mensaje: 'No se pudo actualizar la configuración.', status: 500,
    });
  }
}

export async function onRequestPatch({ request, env }: any): Promise<Response> {
  return observarSolicitud(
    request,
    'admin.reservations.configuration.update',
    contexto => actualizar(request, env, contexto.requestId)
  );
}
