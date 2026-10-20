import {
  actualizarModalidadConfiguracion,
  actualizarServicioAlojamientoConfiguracion,
  crearModalidadConfiguracion,
  crearServicioAlojamientoConfiguracion,
  actualizarEspacioConfiguracion,
  actualizarHorariosComidasConfiguracion,
  actualizarParametroConfiguracion,
  actualizarOpcionPreparacionConfiguracion,
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
        id: Number(body.id), modalidad: String(body.modalidad || '') as any,
        contexto: String(body.contexto || '') as any,
        unidadVenta: String(body.unidad_venta || '') as any,
        habilitada: body.habilitada === true, expectedUpdatedAt: String(body.expected_updated_at || ''),
        nombreComercial: String(body.nombre_comercial || body.modalidad || ''),
        descripcionComercial: String(body.descripcion_comercial || ''),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: modalidad, meta: { version: 'v1' } });
    }
    if (accion === 'crear_modalidad') {
      const modalidad = await crearModalidadConfiguracion({
        espacioCodigo: String(body.espacio_codigo || ''), modalidad: String(body.modalidad || '') as any,
        contexto: String(body.contexto || '') as any, unidadVenta: String(body.unidad_venta || '') as any,
        habilitada: body.habilitada === true, nombreComercial: String(body.nombre_comercial || ''),
        descripcionComercial: String(body.descripcion_comercial || ''),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: modalidad, meta: { version: 'v1' } }, 201);
    }
    if (accion === 'actualizar_servicio_alojamiento') {
      const servicio = await actualizarServicioAlojamientoConfiguracion({
        id: Number(body.id), tipoAlojamiento: String(body.tipo_alojamiento || '') as any,
        nombre: String(body.nombre || ''), disponibilidad: String(body.disponibilidad || '') as any,
        detalle: String(body.detalle || ''), visibleEnReserva: body.visible_en_reserva === true,
        orden: Number(body.orden), expectedUpdatedAt: String(body.expected_updated_at || ''),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: servicio, meta: { version: 'v1' } });
    }
    if (accion === 'crear_servicio_alojamiento') {
      const servicio = await crearServicioAlojamientoConfiguracion({
        tipoAlojamiento: String(body.tipo_alojamiento || '') as any,
        codigo: String(body.codigo || ''), nombre: String(body.nombre || ''),
        disponibilidad: String(body.disponibilidad || '') as any, detalle: String(body.detalle || ''),
        visibleEnReserva: body.visible_en_reserva === true, orden: Number(body.orden),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: servicio, meta: { version: 'v1' } }, 201);
    }
    if (accion === 'actualizar_opcion_preparacion') {
      const opcion = await actualizarOpcionPreparacionConfiguracion({
        id: Number(body.id), tipoAlojamiento: String(body.tipo_alojamiento || '') as any,
        modalidad: String(body.modalidad || '') as any,
        cantidadPersonas: Number(body.cantidad_personas), nombre: String(body.nombre || ''),
        descripcion: String(body.descripcion || ''), habilitada: body.habilitada === true,
        orden: Number(body.orden), expectedUpdatedAt: String(body.expected_updated_at || ''),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: opcion, meta: { version: 'v1' } });
    }
    if (accion === 'actualizar_espacio') {
      const espacio = await actualizarEspacioConfiguracion({
        codigo: String(body.codigo || ''), capacidadComercial: Number(body.capacidad_comercial),
        capacidadOperativaMaxima: Number(body.capacidad_operativa_maxima),
        reservableGeneral: body.reservable_general === true,
        reservableRetiro: body.reservable_retiro === true,
        estado: String(body.estado || '') as any,
        expectedUpdatedAt: String(body.expected_updated_at || ''),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: espacio, meta: { version: 'v1' } });
    }
    if (accion === 'publicar_tarifa_alimentacion') {
      const tarifa = await publicarTarifaAlimentacionConfiguracion({
        codigo: String(body.codigo || '') as 'desayuno_incluido' | 'pension_completa',
        precioComidaCentavos: Number(body.precio_comida_centavos),
        precioDesayunoCentavos: body.precio_desayuno_centavos == null ? undefined : Number(body.precio_desayuno_centavos),
        precioAlmuerzoCentavos: body.precio_almuerzo_centavos == null ? undefined : Number(body.precio_almuerzo_centavos),
        precioCenaCentavos: body.precio_cena_centavos == null ? undefined : Number(body.precio_cena_centavos),
        ajustePaqueteCentavos: body.ajuste_paquete_centavos == null ? undefined : Number(body.ajuste_paquete_centavos),
        expectedVersion: Number(body.expected_version), motivo: String(body.motivo || ''),
        actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: tarifa, meta: { version: 'v1' } });
    }
    if (accion === 'actualizar_horarios_comidas') {
      const horarios = await actualizarHorariosComidasConfiguracion({
        desayuno: {
          desde: String(body.desayuno_desde || ''),
          hasta: String(body.desayuno_hasta || ''),
        },
        almuerzo: {
          desde: String(body.almuerzo_desde || ''),
          hasta: String(body.almuerzo_hasta || ''),
        },
        cena: {
          desde: String(body.cena_desde || ''),
          hasta: String(body.cena_hasta || ''),
        },
        expectedVersion: Number(body.expected_version),
        motivo: String(body.motivo || ''), actorEmail: auth.email, correlationId,
      }, repositorio);
      return json({ data: horarios, meta: { version: 'v1' } });
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
