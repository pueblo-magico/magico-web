import { crearReservaPublica } from '../../../../_application/reservas/crearReservaPublica.ts';
import { D1RepositorioConfiguracionBaseReservas } from '../../../../_infrastructure/d1/D1RepositorioConfiguracionBaseReservas.ts';
import { D1RepositorioCreacionReservaPublica } from '../../../../_infrastructure/d1/D1RepositorioCreacionReservaPublica.ts';
import { D1RepositorioDisponibilidad } from '../../../../_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  respuestaIntegracion,
} from '../../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';
import { leerJsonSeguro } from '../../../../_interfaces/http/requestSecurity.ts';
import { prepararCuentaCobroReservaHttp } from '../../../../_interfaces/http/reservationCollectionAccount.ts';

const statusPorCodigo: Record<string, number> = {
  SOLICITUD_INVALIDA: 400,
  IDEMPOTENCY_KEY_REQUERIDA: 400,
  IDEMPOTENCY_KEY_REUTILIZADA: 409,
  CONSULTA_NO_ENCONTRADA: 404,
  COTIZACION_NO_ENCONTRADA: 404,
  COTIZACION_VENCIDA: 410,
  INVENTARIO_NO_DISPONIBLE: 409,
};

async function crear(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'reservas:crear');
  if (identidad instanceof Response) return identidad;
  const limitada = respuestaLimite(await consumirLimite(
    request, env, 'integracion.v1.reservas', 30, 60, `integracion:${identidad}`
  ));
  if (limitada) return limitada;

  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request);
  } catch {
    return errorIntegracion('SOLICITUD_INVALIDA', 'El cuerpo JSON es inválido.', 400, false);
  }
  const cliente = body.cliente && typeof body.cliente === 'object' && !Array.isArray(body.cliente)
    ? body.cliente as Record<string, unknown>
    : {};
  const contactoRef = String(body.contacto_id || '');
  const conversacionRef = body.conversacion_id ? String(body.conversacion_id) : null;

  const resultado = await crearReservaPublica({
    cotizacionCodigo: String(body.cotizacion_codigo || ''),
    espacioCodigo: String(body.espacio_codigo || ''),
    clienteNombre: String(cliente.nombre || ''),
    clienteTelefono: cliente.telefono ? String(cliente.telefono) : null,
    clienteEmail: cliente.email ? String(cliente.email) : null,
    idempotencyKey: request.headers.get('Idempotency-Key') || '',
    canalOrigen: 'n8n',
    referenciaIntegracion: {
      integracion: 'n8n',
      contactoRef,
      conversacionRef,
      consultaCodigo: body.consulta_codigo ? String(body.consulta_codigo) : null,
    },
  }, new D1RepositorioCreacionReservaPublica(env.DB), new D1RepositorioDisponibilidad(env.DB),
  new D1RepositorioConfiguracionBaseReservas(env.DB));

  if (resultado.ok === false) {
    return errorIntegracion(
      resultado.error.codigo,
      resultado.error.mensaje,
      statusPorCodigo[resultado.error.codigo] || 400,
      false
    );
  }
  const cuentaCobro = await prepararCuentaCobroReservaHttp(env, resultado.valor.reservaId);
  return respuestaIntegracion(identidad, {
    reserva: {
      codigo: resultado.valor.codigo,
      estado: resultado.valor.estado,
      expires_at: resultado.valor.expiresAt,
    },
    cotizacion_codigo: resultado.valor.cotizacionCodigo,
    contacto_id: contactoRef.trim(),
    conversacion_id: conversacionRef?.trim() || null,
    cuenta_cobro: cuentaCobro,
  }, resultado.valor.idempotente ? 200 : 201, { idempotente: resultado.valor.idempotente });
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'integration.v1.reservation.create', () => crear(request, env));
}
