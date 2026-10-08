import { crearConsultaIntegracion } from '../../../_application/reservas/crearConsultaIntegracion.ts';
import { D1RepositorioCreacionConsultaIntegracion } from '../../../_infrastructure/d1/D1RepositorioCreacionConsultaIntegracion.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  respuestaIntegracion,
} from '../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../_interfaces/http/observability.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';
import { leerJsonSeguro } from '../../../_interfaces/http/requestSecurity.ts';

const statusPorCodigo: Record<string, number> = {
  SOLICITUD_INVALIDA: 400,
  IDEMPOTENCY_KEY_REQUERIDA: 400,
  IDEMPOTENCY_KEY_REUTILIZADA: 409,
  COTIZACION_NO_ENCONTRADA: 404,
};

function numeroOpcional(valor: unknown): number | null {
  return valor === undefined || valor === null || valor === '' ? null : Number(valor);
}

async function crear(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'consultas:crear');
  if (identidad instanceof Response) return identidad;
  const limitada = respuestaLimite(await consumirLimite(
    request, env, 'integracion.v1.consultas', 30, 60, `integracion:${identidad}`
  ));
  if (limitada) return limitada;

  let body: Record<string, unknown>;
  try { body = await leerJsonSeguro(request); } catch {
    return errorIntegracion('SOLICITUD_INVALIDA', 'El cuerpo JSON es inválido.', 400, false);
  }
  const cliente = body.cliente && typeof body.cliente === 'object' && !Array.isArray(body.cliente)
    ? body.cliente as Record<string, unknown>
    : {};
  const resultado = await crearConsultaIntegracion({
    clienteNombre: String(cliente.nombre || ''),
    clienteTelefono: cliente.telefono ? String(cliente.telefono) : null,
    clienteEmail: cliente.email ? String(cliente.email) : null,
    alojamientoInteres: body.alojamiento_interes ? String(body.alojamiento_interes) : null,
    fechaDesde: body.fecha_desde ? String(body.fecha_desde) : null,
    fechaHasta: body.fecha_hasta ? String(body.fecha_hasta) : null,
    cantidadPersonas: numeroOpcional(body.cantidad_personas),
    montoEstimadoCentavos: numeroOpcional(body.monto_estimado_centavos),
    cotizacionCodigo: body.cotizacion_codigo ? String(body.cotizacion_codigo) : null,
    contactoRef: String(body.contacto_id || ''),
    conversacionRef: body.conversacion_id ? String(body.conversacion_id) : null,
    idempotencyKey: request.headers.get('Idempotency-Key') || '',
  }, new D1RepositorioCreacionConsultaIntegracion(env.DB));

  if (resultado.ok === false) {
    return errorIntegracion(
      resultado.error.codigo,
      resultado.error.mensaje,
      statusPorCodigo[resultado.error.codigo] || 400,
      false
    );
  }
  return respuestaIntegracion(identidad, {
    consulta: {
      codigo: resultado.valor.codigo,
      estado: resultado.valor.estado,
      created_at: resultado.valor.createdAt,
    },
    contacto_id: String(body.contacto_id || '').trim(),
    conversacion_id: body.conversacion_id ? String(body.conversacion_id).trim() : null,
    cotizacion_codigo: resultado.valor.cotizacionCodigo,
  }, resultado.valor.idempotente ? 200 : 201, {
    idempotente: resultado.valor.idempotente,
    bloquea_inventario: false,
  });
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'integration.v1.inquiry.create', () => crear(request, env));
}
