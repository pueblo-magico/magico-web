// Cloudflare Pages Function — carga una reserva manual desde el Panel de
// Reservas. Para cuando ManyChat falla, se cierra una reserva a mano
// (teléfono, en persona) o viene de otro canal (Airbnb, etc.) que no pasa
// por el flujo automático.
//
// Protegido por sesión propia, roles super_admin/editor — ver
// functions/_lib/authGuard.ts y nota en functions/api/admin/reservas.ts.
//
// El chequeo de solapamiento es INFORMATIVO, no bloquea la creación: quien
// carga esto a mano puede saber algo que el sistema todavía no sabe (por
// ejemplo, que la reserva de Airbnb que está cargando YA existe en la
// realidad, aunque nuestra grilla la marque "libre").

import { requirePermission } from '../../_lib/authGuard';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import { crearReservaManual } from '../../_application/reservas/crearReservaManual.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioCreacionReserva } from '../../_infrastructure/d1/D1RepositorioCreacionReserva.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';
import { TIPOS_ESTADIA } from '../../_domain/reservas/reservationCatalog.ts';

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'reservas.crear');
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const {
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    alojamiento_id,
    fecha_checkin,
    fecha_checkout,
    cantidad_personas,
    monto_total,
    monto_sena,
    estado,
    canal_origen,
    tipo_estadia,
  } = body || {};

  if (!cliente_nombre || !alojamiento_id || !fecha_checkin || !fecha_checkout || !cantidad_personas || monto_total === undefined || monto_total === null) {
    return json(
      { error: 'Faltan campos obligatorios: cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas, monto_total.' },
      400
    );
  }
  if (estado && !['pendiente', 'confirmada', 'cancelada'].includes(estado)) {
    return json({ error: "estado debe ser 'pendiente', 'confirmada' o 'cancelada'." }, 400);
  }
  if (tipo_estadia && !TIPOS_ESTADIA.includes(tipo_estadia)) {
    return json({ error: `tipo_estadia debe ser uno de: ${TIPOS_ESTADIA.join(', ')}.` }, 400);
  }

  try {
    const resultado = await crearReservaManual(
      {
        actorEmail: auth.email,
        clienteNombre: cliente_nombre,
        clienteTelefono: cliente_telefono || null,
        clienteEmail: cliente_email || null,
        alojamientoId: alojamiento_id,
        fechaCheckin: fecha_checkin,
        fechaCheckout: fecha_checkout,
        cantidadPersonas: cantidad_personas,
        montoTotal: monto_total,
        montoSena: monto_sena ?? null,
        estado: estado || 'confirmada',
        canalOrigen: canal_origen || 'Manual',
        tipoEstadia: tipo_estadia || 'huesped',
      },
      new D1RepositorioCreacionReserva(env.DB),
      new D1RegistroAuditoriaReservas(env.DB)
    );

    return json({ ok: true, reserva_id: resultado.reservaId, disponible: resultado.disponible }, 200);
  } catch (error: unknown) {
    return respuestaErrorReserva(error, {
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'No se pudo crear la reserva con los datos enviados.',
      status: 400,
    });
  }
}
