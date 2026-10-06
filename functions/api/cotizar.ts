// Cloudflare Pages Function — motor de cotización del sistema de reservas.
// Recibe una fecha_entrada/fecha_salida + tipo_alojamiento y devuelve disponibilidad,
// desglose de precio, seña y saldo. No crea la reserva — es solo el "cotizador".

import { cotizarEstadia } from '../_lib/cotizador';
import { consumirLimite, respuestaLimite } from '../_interfaces/http/rateLimit.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../_interfaces/http/requestSecurity.ts';

const ALLOWED_ORIGINS = [
  'https://experienciamagico.com',
];
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) || LOCALHOST_ORIGIN.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function onRequestOptions({ request }: any) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }: any) {
  const headers = corsHeaders(request);
  const limitada = respuestaLimite(await consumirLimite(request, env, 'publico.cotizar', 60, 60));
  if (limitada) return limitada;

  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error, headers);
  }

  const {
    fecha_entrada, fecha_salida, cantidad_personas, tipo_alojamiento,
    modalidad, contexto,
    regimen_alimentacion,
  } = body || {};

  if (!fecha_entrada || !fecha_salida || !cantidad_personas || !tipo_alojamiento) {
    return json(
      { error: 'Faltan campos: fecha_entrada, fecha_salida, cantidad_personas, tipo_alojamiento son todos requeridos.' },
      400,
      headers
    );
  }
  if (tipo_alojamiento !== 'domo' && tipo_alojamiento !== 'refugio') {
    return json({ error: "tipo_alojamiento debe ser 'domo' o 'refugio'." }, 400, headers);
  }
  const personas = Number(cantidad_personas);
  if (!Number.isInteger(personas) || personas < 1) {
    return json({ error: 'cantidad_personas debe ser un entero positivo.' }, 400, headers);
  }
  if (modalidad !== undefined && !['privada', 'compartida'].includes(modalidad)) {
    return json({ error: "modalidad debe ser 'privada' o 'compartida'." }, 400, headers);
  }
  if (contexto !== undefined && !['general', 'retiro'].includes(contexto)) {
    return json({ error: "contexto debe ser 'general' o 'retiro'." }, 400, headers);
  }
  if (regimen_alimentacion !== undefined &&
      !['desayuno_incluido', 'pension_completa'].includes(regimen_alimentacion)) {
    return json({ error: "regimen_alimentacion debe ser 'desayuno_incluido' o 'pension_completa'." }, 400, headers);
  }

  const resultado = await cotizarEstadia(env.DB, {
    tipo: tipo_alojamiento,
    personas,
    fechaEntrada: fecha_entrada,
    fechaSalida: fecha_salida,
    modalidad,
    contexto,
    regimenAlimentacion: regimen_alimentacion,
  });
  if (resultado.ok === false) {
    return json({ error: resultado.error.mensaje }, 400, headers);
  }

  const cotizacion = resultado.valor;

  return json(
    {
      estado: cotizacion.disponibilidad.estado,
      fecha_entrada,
      fecha_salida,
      desglose: cotizacion.desglose,
      subtotal: cotizacion.desglose.subtotal,
      sena: cotizacion.sena,
      saldo_checkin: cotizacion.saldoCheckin,
      mensaje_privacidad: cotizacion.mensajePrivacidad,
      cotizacion: cotizacion.referencia,
      moneda: cotizacion.desglose.moneda,
      subtotal_centavos: cotizacion.desglose.subtotal_centavos,
      sena_centavos: cotizacion.sena.monto_centavos,
    },
    200,
    headers
  );
}
