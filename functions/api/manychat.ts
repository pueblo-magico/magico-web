// Cloudflare Pages Function — recibe la cotización + user_id desde un flow de
// ManyChat, chequea disponibilidad, crea la reserva 'pendiente' en D1 y genera
// el link de pago de Mercado Pago por el monto de la seña.
//
// Requiere estas variables de entorno en Cloudflare Pages:
//   MANYCHAT_INBOUND_SECRET — secreto propio que valida X-ManyChat-Secret.
//                             No es el API key de la cuenta de ManyChat.
//   MP_ACCESS_TOKEN          — access token de Mercado Pago (Producción o Test)
//                              para crear la Preferencia de pago.

import { iniciarReservaManyChat } from '../_application/reservas/iniciarReservaManyChat.ts';
import { D1RepositorioDisponibilidad } from '../_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { D1RepositorioReservasManyChat } from '../_infrastructure/d1/D1RepositorioReservasManyChat.ts';
import { MercadoPagoCheckoutReservas } from '../_infrastructure/mercadopago/MercadoPagoCheckoutReservas.ts';
import { jsonReserva as json } from '../_interfaces/http/reservasHttp.ts';
import { obtenerOrigenSolicitudManyChat } from '../_interfaces/http/manychatAuth.ts';
import { autenticarServicio } from '../_interfaces/http/serviceAuth.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../_interfaces/http/requestSecurity.ts';
import { consumirLimite, respuestaLimite } from '../_interfaces/http/rateLimit.ts';

export async function onRequestPost({ request, env }: any) {
  const secreto = request.headers.get('X-ManyChat-Secret') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!autenticarServicio('manychat', secreto, env, 'reservas:crear')) {
    return json({ error: 'No autorizado.' }, 401);
  }

  const limitada = respuestaLimite(await consumirLimite(request, env, 'integracion.manychat', 30, 60, `manychat:${secreto}`));
  if (limitada) return limitada;

  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
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

  const resultado = await iniciarReservaManyChat({
    tipo: alojamiento_seleccionado,
    personas,
    fechaEntrada: fecha_entrada,
    fechaSalida: fecha_salida,
    userId: String(user_id),
  },
  new D1RepositorioDisponibilidad(env.DB),
  new D1RepositorioReservasManyChat(env.DB),
  new MercadoPagoCheckoutReservas(env.MP_ACCESS_TOKEN, obtenerOrigenSolicitudManyChat(request.url)));

  if (resultado.estado === 'error_validacion') {
    return json({ error: resultado.mensaje }, 400);
  }
  if (resultado.estado === 'ocupado') {
    return json(
      { estado: 'ocupado', mensaje: 'No hay disponibilidad para esas fechas. ¿Querés que te proponga otras opciones?' },
      200
    );
  }
  if (resultado.estado === 'error_creacion') {
    return json({ error: 'No se pudo crear la reserva.' }, 500);
  }
  if (resultado.estado === 'error_pago') {
    return json(
      { estado: 'error_pago', reserva_id: resultado.reservaId, error: 'No se pudo generar el link de pago.' },
      502
    );
  }

  const cotizacion = resultado.cotizacion;
  return json(
    {
      estado: 'pendiente_pago',
      reserva_id: resultado.reservaId,
      checkout_url: resultado.checkoutUrl,
      subtotal: cotizacion.desglose.subtotal,
      monto_sena: cotizacion.sena.monto,
      saldo_checkin: cotizacion.saldoCheckin,
      mensaje_privacidad: cotizacion.mensajePrivacidad,
    },
    200
  );
}
