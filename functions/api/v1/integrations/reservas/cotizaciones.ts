import { esRegimenAlimentacion } from '../../../../_domain/reservas/alimentacion.ts';
import { cotizarEstadia } from '../../../../_lib/cotizador.ts';
import {
  autenticarIntegracionReservas,
  errorIntegracion,
  respuestaIntegracion,
} from '../../../../_interfaces/http/integrationApiV1.ts';
import { observarSolicitud } from '../../../../_interfaces/http/observability.ts';
import { consumirLimite, respuestaLimite } from '../../../../_interfaces/http/rateLimit.ts';
import { leerJsonSeguro } from '../../../../_interfaces/http/requestSecurity.ts';

async function cotizar(request: Request, env: any): Promise<Response> {
  const identidad = autenticarIntegracionReservas(request, env, 'reservas:cotizar');
  if (identidad instanceof Response) return identidad;
  const limitada = respuestaLimite(await consumirLimite(
    request, env, 'integracion.v1.cotizaciones', 60, 60, `integracion:${identidad}`
  ));
  if (limitada) return limitada;
  let body: Record<string, unknown>;
  try {
    body = await leerJsonSeguro(request);
  } catch {
    return errorIntegracion('SOLICITUD_INVALIDA', 'El cuerpo JSON es inválido.', 400, false);
  }
  const tipo = body.tipo_alojamiento;
  const modalidad = body.modalidad || (tipo === 'domo' ? 'privada' : 'compartida');
  const contexto = body.contexto || 'general';
  const personas = Number(body.personas);
  const regimen = body.regimen_alimentacion ?? 'desayuno_incluido';
  if ((tipo !== 'domo' && tipo !== 'refugio') || !Number.isInteger(personas) || personas < 1 ||
      !['privada', 'compartida'].includes(String(modalidad)) ||
      !['general', 'retiro'].includes(String(contexto)) || !esRegimenAlimentacion(regimen)) {
    return errorIntegracion('SOLICITUD_INVALIDA', 'La solicitud de cotización es inválida.', 400, false);
  }
  const resultado = await cotizarEstadia(env.DB, {
    tipo, personas, fechaEntrada: String(body.check_in || ''), fechaSalida: String(body.check_out || ''),
    modalidad: modalidad as 'privada' | 'compartida', contexto: contexto as 'general' | 'retiro',
    regimenAlimentacion: regimen,
  });
  if (resultado.ok === false) {
    return errorIntegracion(resultado.error.codigo, resultado.error.mensaje, 400, false);
  }
  const valor = resultado.valor;
  return respuestaIntegracion(identidad, {
    estado: valor.disponibilidad.estado,
    motivo_codigo: valor.disponibilidad.motivo_codigo,
    opcion: valor.disponibilidad.estado === 'disponible' && valor.disponibilidad.espacio_codigo ? {
      espacio_codigo: valor.disponibilidad.espacio_codigo,
      modalidad: valor.disponibilidad.modalidad,
      capacidad_disponible: valor.disponibilidad.capacidad_disponible,
    } : null,
    cotizacion: valor.referencia,
    precio: {
      moneda: valor.desglose.moneda,
      regimen_alimentacion: valor.desglose.regimen_alimentacion,
      subtotal_centavos: valor.desglose.subtotal_centavos,
      sena_centavos: valor.sena.monto_centavos,
      saldo_centavos: valor.desglose.subtotal_centavos - valor.sena.monto_centavos,
      plan_codigo: valor.desglose.plan_codigo,
      plan_version: valor.desglose.plan_version,
    },
  }, 200, { intervalo: '[check_in, check_out)' });
}

export async function onRequestPost({ request, env }: any): Promise<Response> {
  return observarSolicitud(request, 'integration.v1.quote', () => cotizar(request, env));
}
