// Cloudflare Pages Function — motor de cotización del sistema de reservas.
// Recibe una fecha_entrada/fecha_salida + tipo_alojamiento y devuelve disponibilidad,
// desglose de precio, seña y saldo. No crea la reserva — es solo el "cotizador".

import { calcularPrecio, chequearDisponibilidad, mensajePrivacidad, nochesEntre } from '../_lib/cotizador';

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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400, headers);
  }

  const { fecha_entrada, fecha_salida, cantidad_personas, tipo_alojamiento } = body || {};

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

  const noches = nochesEntre(fecha_entrada, fecha_salida);
  if (noches === null) {
    return json({ error: 'Fechas inválidas: fecha_salida debe ser posterior a fecha_entrada.' }, 400, headers);
  }

  const precio = calcularPrecio(tipo_alojamiento, personas, fecha_entrada, fecha_salida);
  if ('error' in precio) {
    return json({ error: precio.error }, 400, headers);
  }

  const { estado } = await chequearDisponibilidad(env.DB, tipo_alojamiento, personas, fecha_entrada, fecha_salida);

  // Seña del 50%; el otro 50% se abona a más tardar al llegar.
  const senaPorcentaje = 0.5;
  const montoSena = Math.round(precio.subtotal * senaPorcentaje);
  const saldoCheckin = precio.subtotal - montoSena;

  return json(
    {
      estado,
      fecha_entrada,
      fecha_salida,
      desglose: precio,
      subtotal: precio.subtotal,
      sena: {
        porcentaje: senaPorcentaje,
        monto: montoSena,
      },
      saldo_checkin: saldoCheckin,
      mensaje_privacidad: mensajePrivacidad(tipo_alojamiento, personas),
    },
    200,
    headers
  );
}
