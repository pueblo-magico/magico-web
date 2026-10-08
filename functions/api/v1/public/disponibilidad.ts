import { nochesEntre } from '../../../_domain/reservas/dateRange.ts';
import { D1RepositorioDisponibilidad } from '../../../_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { jsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'GET');

export async function onRequestGet({ request, env }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.disponibilidad', 60, 60));
  if (limitada) return limitada;
  const params = new URL(request.url).searchParams;
  const checkIn = params.get('check_in') || '';
  const checkOut = params.get('check_out') || '';
  const personas = Number(params.get('personas'));
  const tipo = params.get('tipo_alojamiento');
  const modalidad = params.get('modalidad') || (tipo === 'domo' ? 'privada' : 'compartida');
  const contexto = params.get('contexto') || 'general';

  if (nochesEntre(checkIn, checkOut) === null || !Number.isInteger(personas) || personas < 1 ||
      (tipo !== 'domo' && tipo !== 'refugio') ||
      !['privada', 'compartida'].includes(modalidad) || !['general', 'retiro'].includes(contexto)) {
    return jsonPublico(request, 'GET', {
      error: { codigo: 'SOLICITUD_INVALIDA', mensaje: 'Fechas, personas, alojamiento, modalidad o contexto inválidos.' },
    }, 400);
  }

  const resultado = await new D1RepositorioDisponibilidad(env.DB).consultar({
    tipo, personas, fechaEntrada: checkIn, fechaSalida: checkOut,
    modalidad: modalidad as 'privada' | 'compartida', contexto: contexto as 'general' | 'retiro',
  });
  return jsonPublico(request, 'GET', {
    data: {
      check_in: checkIn, check_out: checkOut, personas, tipo_alojamiento: tipo,
      modalidad, contexto, estado: resultado.estado,
      motivo_codigo: resultado.motivo_codigo,
      opcion: resultado.estado === 'disponible' && resultado.espacio_codigo ? {
        espacio_codigo: resultado.espacio_codigo,
        capacidad_disponible: resultado.capacidad_disponible,
      } : null,
    },
    meta: { version: 'v1', intervalo: '[check_in, check_out)' },
  });
}
