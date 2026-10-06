import { cotizarEstadia } from '../../../_lib/cotizador.ts';
import { jsonPublico, leerJsonPublico, optionsPublico } from '../../../_interfaces/http/publicApiV1.ts';
import { consumirLimite, respuestaLimite } from '../../../_interfaces/http/rateLimit.ts';

export const onRequestOptions = ({ request }: any) => optionsPublico(request, 'POST');

export async function onRequestPost({ request, env }: any) {
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.v1.cotizaciones', 60, 60));
  if (limitada) return limitada;
  const lectura = await leerJsonPublico(request, 'POST');
  if (!lectura.ok) return lectura.response;
  const body: any = lectura.body;
  const tipo = body.tipo_alojamiento;
  const modalidad = body.modalidad || (tipo === 'domo' ? 'privada' : 'compartida');
  const contexto = body.contexto || 'general';
  const personas = Number(body.personas);
  if ((tipo !== 'domo' && tipo !== 'refugio') || !Number.isInteger(personas) || personas < 1 ||
      !['privada', 'compartida'].includes(modalidad) || !['general', 'retiro'].includes(contexto)) {
    return jsonPublico(request, 'POST', { error: { codigo: 'SOLICITUD_INVALIDA', mensaje: 'La solicitud es inválida.' } }, 400);
  }

  const resultado = await cotizarEstadia(env.DB, {
    tipo, personas, fechaEntrada: String(body.check_in || ''), fechaSalida: String(body.check_out || ''),
    modalidad, contexto,
  });
  if (resultado.ok === false) {
    return jsonPublico(request, 'POST', { error: resultado.error }, 400);
  }
  const cotizacion = resultado.valor;
  return jsonPublico(request, 'POST', {
    data: {
      estado: cotizacion.disponibilidad.estado,
      motivo_codigo: cotizacion.disponibilidad.motivo_codigo,
      opcion: cotizacion.disponibilidad.estado === 'disponible' && cotizacion.disponibilidad.espacio_codigo ? {
        espacio_codigo: cotizacion.disponibilidad.espacio_codigo,
        modalidad: cotizacion.disponibilidad.modalidad,
        capacidad_disponible: cotizacion.disponibilidad.capacidad_disponible,
      } : null,
      cotizacion: cotizacion.referencia,
      precio: {
        moneda: cotizacion.desglose.moneda,
        subtotal_centavos: cotizacion.desglose.subtotal_centavos,
        sena_centavos: cotizacion.sena.monto_centavos,
        saldo_centavos: cotizacion.desglose.subtotal_centavos - cotizacion.sena.monto_centavos,
        plan_codigo: cotizacion.desglose.plan_codigo,
        plan_version: cotizacion.desglose.plan_version,
        desglose_noches: cotizacion.desglose.desglose_noches,
      },
    },
    meta: { version: 'v1', intervalo: '[check_in, check_out)' },
  });
}
