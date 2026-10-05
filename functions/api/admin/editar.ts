// Cloudflare Pages Function — edita cualquier campo editable de una reserva
// desde el Panel de Reservas (nombre, teléfono, fechas, montos, alojamiento,
// canal, unidad asignada). También se usa para "cancelar": no existe un
// endpoint de borrado — cancelar es simplemente estado = 'cancelada', así
// la reserva queda registrada en el historial en vez de desaparecer.
//
// Protegido por sesión propia, roles super_admin/editor — ver
// functions/_lib/authGuard.ts y nota en functions/api/admin/reservas.ts.
//
// Update parcial: solo se tocan los campos presentes en el body. Las
// validaciones de fechas/estado/cantidad_personas las hace el propio CHECK
// del schema (schema.sql) — si el UPDATE las viola, D1 tira el error y acá
// simplemente lo devolvemos legible, en vez de duplicar esa lógica.

import { requireAuth, tienePermiso } from '../../_lib/authGuard';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';
import {
  CAMPOS_EDITABLES_RESERVA,
  editarReserva,
} from '../../_application/reservas/editarReserva.ts';
import type { CambiosReserva, CampoEditableReserva } from '../../_application/reservas/ports.ts';
import { D1RegistroAuditoriaReservas } from '../../_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioEdicionReserva } from '../../_infrastructure/d1/D1RepositorioEdicionReserva.ts';
import { jsonReserva as json, respuestaErrorReserva } from '../../_interfaces/http/reservasHttp.ts';

export async function onRequestPost({ request, env }: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await leerJsonSeguro(request);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const { reserva_id, ...resto } = body || {};
  const permiso = resto.estado === 'cancelada' ? 'reservas.cancelar' : 'reservas.editar';
  if (!tienePermiso(auth, permiso)) return json({ error: 'No tenés permiso para esta acción.' }, 403);
  if (('monto_total' in resto || 'monto_sena' in resto) && !tienePermiso(auth, 'reservas.pagos.gestionar')) {
    return json({ error: 'No tenés permiso para modificar importes.' }, 403);
  }
  const id = Number(reserva_id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ error: 'reserva_id debe ser un entero válido.' }, 400);
  }

  const entradas = Object.entries(resto).filter(([campo]) =>
    CAMPOS_EDITABLES_RESERVA.includes(campo as CampoEditableReserva)
  );
  if (entradas.length === 0) {
    return json({ error: `Nada para actualizar. Campos válidos: ${CAMPOS_EDITABLES_RESERVA.join(', ')}.` }, 400);
  }

  if ('estado' in resto && !['pendiente', 'confirmada', 'cancelada'].includes(resto.estado)) {
    return json({ error: "estado debe ser 'pendiente', 'confirmada' o 'cancelada'." }, 400);
  }

  const cambios = Object.fromEntries(entradas) as CambiosReserva;
  try {
    const resultado = await editarReserva(
      { reservaId: id, cambios, actorEmail: auth.email },
      new D1RepositorioEdicionReserva(env.DB),
      new D1RegistroAuditoriaReservas(env.DB)
    );

    if (!resultado.ok) return json({ error: `No existe la reserva #${id}.` }, 404);

    return json({ ok: true, reserva_id: resultado.reservaId });
  } catch (error: unknown) {
    // Típicamente un CHECK violado (fecha_checkout <= fecha_checkin, estado
    // inválido, cantidad_personas <= 0) o un alojamiento_id que no existe.
    return respuestaErrorReserva(error, {
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'No se pudo actualizar la reserva con los datos enviados.',
      status: 400,
    });
  }
}
