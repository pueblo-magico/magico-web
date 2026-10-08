import { nochesEntre } from '../../../../_domain/reservas/dateRange.ts';
import { D1RepositorioDisponibilidad } from '../../../../_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  respuestaIntegracion,
} from '../../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';

async function consultar(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'reservas:disponibilidad');
  if (identidad instanceof Response) return identidad;
  const limitada = respuestaLimite(await consumirLimite(
    request, env, 'integracion.v1.disponibilidad', 60, 60, `integracion:${identidad}`
  ));
  if (limitada) return limitada;
  const params = new URL(request.url).searchParams;
  const checkIn = params.get('check_in') || '';
  const checkOut = params.get('check_out') || '';
  const personas = Number(params.get('personas'));
  const tipo = params.get('tipo_alojamiento');
  const modalidad = params.get('modalidad') || (tipo === 'domo' ? 'privada' : 'compartida');
  const contexto = params.get('contexto') || 'general';
  if (nochesEntre(checkIn, checkOut) === null || !Number.isInteger(personas) || personas < 1 ||
      (tipo !== 'domo' && tipo !== 'refugio') || !['privada', 'compartida'].includes(modalidad) ||
      !['general', 'retiro'].includes(contexto)) {
    return errorIntegracion('SOLICITUD_INVALIDA', 'Los parámetros de disponibilidad son inválidos.', 400, false);
  }
  const resultado = await new D1RepositorioDisponibilidad(env.DB).consultar({
    tipo, personas, fechaEntrada: checkIn, fechaSalida: checkOut,
    modalidad: modalidad as 'privada' | 'compartida', contexto: contexto as 'general' | 'retiro',
  });
  return respuestaIntegracion(identidad, {
    check_in: checkIn, check_out: checkOut, personas, tipo_alojamiento: tipo,
    modalidad, contexto, estado: resultado.estado, motivo_codigo: resultado.motivo_codigo,
    opcion: resultado.estado === 'disponible' && resultado.espacio_codigo ? {
      espacio_codigo: resultado.espacio_codigo,
      capacidad_disponible: resultado.capacidad_disponible,
    } : null,
  }, 200, { intervalo: '[check_in, check_out)' });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'integration.v1.availability', () => consultar(request, env));
}
