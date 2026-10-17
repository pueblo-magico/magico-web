// Cloudflare Pages Function — recibe la cotización + user_id desde un flow de
// ManyChat, chequea disponibilidad, crea la reserva 'pendiente' en D1 y genera
// el link de pago de Mercado Pago por el monto de la seña.
//
// Requiere estas variables de entorno en Cloudflare Pages:
//   MANYCHAT_API_KEY   — secreto compartido con ManyChat (valida X-ManyChat-Secret
//                         Y se usa como Bearer token al llamar la API de ManyChat
//                         desde webhook-mp.ts). Si en tu cuenta de ManyChat el
//                         secreto del External Request y el API key "real" son
//                         valores distintos, separalos en dos env vars.
//   MP_ACCESS_TOKEN     — access token de Mercado Pago (Producción o Test) para
//                         crear la Preferencia de pago.

import { calcularPrecio, chequearDisponibilidad, mensajePrivacidad, nochesEntre } from '../_lib/cotizador';

// Keep the Pages Function independent from the Vite client configuration.
// Importing src/data/config here makes Wrangler evaluate import.meta.env while
// bundling the server-side Function, where Vite's import.meta.env is unavailable.
const SITE_URL = 'https://experienciamagico.com';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }: any) {
  if (request.headers.get('X-ManyChat-Secret') !== env.MANYCHAT_API_KEY) {
    return json({ error: 'No autorizado.' }, 401);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body inválido — se espera JSON.' }, 400);
  }

  const { fecha_entrada, fecha_salida, cantidad_personas, alojamiento_seleccionado, user_id } = body || {};

  if (!fecha_entrada || !fecha_salida || !cantidad_personas || !alojamiento_seleccionado || !user_id) {
    return json(
      { error: 'Faltan campos: fecha_entrada, fecha_salida, cantidad_personas, alojamiento_seleccionado, user_id son todos requeridos.' },
      400
    );
  }
  if (alojamiento_seleccionado !== 'domo' && alojamiento_seleccionado !== 'refugio') {
    return json({ error: "alojamiento_seleccionado debe ser 'domo' o 'refugio'." }, 400);
  }
  const personas = Number(cantidad_personas);
  if (!Number.isInteger(personas) || personas < 1) {
    return json({ error: 'cantidad_personas debe ser un entero positivo.' }, 400);
  }

  const noches = nochesEntre(fecha_entrada, fecha_salida);
  if (noches === null) {
    return json({ error: 'Fechas inválidas: fecha_salida debe ser posterior a fecha_entrada.' }, 400);
  }

  const precio = calcularPrecio(alojamiento_seleccionado, personas, fecha_entrada, fecha_salida);
  if ('error' in precio) {
    return json({ error: precio.error }, 400);
  }

  const db = env.DB;
  const disponibilidad = await chequearDisponibilidad(db, alojamiento_seleccionado, personas, fecha_entrada, fecha_salida);

  if (disponibilidad.estado === 'ocupado' || disponibilidad.alojamiento_id === null) {
    return json(
      { estado: 'ocupado', mensaje: 'No hay disponibilidad para esas fechas. ¿Querés que te proponga otras opciones?' },
      200
    );
  }

  // Seña del 50%; el otro 50% se abona a más tardar al llegar.
  const senaPorcentaje = 0.5;
  const montoSena = Math.round(precio.subtotal * senaPorcentaje);

  // NOTA: el schema exige cliente_nombre y ManyChat solo nos manda el user_id.
  // Guardamos un placeholder identificable — reemplazalo cuando tengas el
  // nombre real (ej. si lo pedís en un paso previo del flow y lo mandás acá).
  const clienteNombrePlaceholder = `ManyChat #${user_id}`;

  const inserted: any = await db
    .prepare(
      `INSERT INTO reservas
        (cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena, estado, manychat_user_id, canal_origen)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, 'ManyChat')
       RETURNING id`
    )
    .bind(clienteNombrePlaceholder, disponibilidad.alojamiento_id, fecha_entrada, fecha_salida, personas, precio.subtotal, montoSena, String(user_id))
    .first();

  const reservaId = inserted?.id;
  if (!reservaId) {
    return json({ error: 'No se pudo crear la reserva.' }, 500);
  }

  let checkoutUrl: string | null = null;
  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: `Seña — ${alojamiento_seleccionado === 'domo' ? 'Domo' : 'Refugio Compartido'}, Pueblo Mágico`,
            quantity: 1,
            unit_price: montoSena,
            currency_id: 'ARS',
          },
        ],
        external_reference: String(reservaId),
        notification_url: `${SITE_URL}/api/webhook-mp`,
        back_urls: {
          success: `${SITE_URL}/reserva-confirmada`,
          pending: `${SITE_URL}/reserva-pendiente`,
          failure: `${SITE_URL}/reserva-fallida`,
        },
        auto_return: 'approved',
      }),
    });

    const mpData: any = await mpRes.json();
    if (!mpRes.ok || !mpData.id) {
      throw new Error(mpData?.message || `Mercado Pago respondió ${mpRes.status}`);
    }

    checkoutUrl = mpData.init_point;
    await db.prepare(`UPDATE reservas SET mp_preference_id = ? WHERE id = ?`).bind(mpData.id, reservaId).run();
  } catch (err: any) {
    // La reserva 'pendiente' ya existe en D1 aunque falle Mercado Pago — queda
    // sujeta a limpieza manual o a un cron futuro que libere pendientes viejas
    // sin mp_preference_id. No la borramos acá para no perder el registro.
    return json(
      { estado: 'error_pago', reserva_id: reservaId, error: `No se pudo generar el link de pago: ${err.message}` },
      502
    );
  }

  return json(
    {
      estado: 'pendiente_pago',
      reserva_id: reservaId,
      checkout_url: checkoutUrl,
      subtotal: precio.subtotal,
      monto_sena: montoSena,
      saldo_checkin: precio.subtotal - montoSena,
      mensaje_privacidad: mensajePrivacidad(alojamiento_seleccionado, personas),
    },
    200
  );
}
