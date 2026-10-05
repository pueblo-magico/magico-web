// Cloudflare Pages Function — sincroniza manualmente el calendario de Airbnb
// de cada alojamiento hacia D1. Se dispara con un botón en el Panel de
// Reservas (no hay cron: Cloudflare Pages no soporta Cron Triggers — ver
// nota en el memo del proyecto. Si más adelante se quiere automatizar, esta
// misma función se puede llamar desde un Worker aparte con su propio cron,
// o desde un servicio externo que le pegue a este endpoint).
//
// Protegido por sesión propia, roles super_admin/editor — ver
// functions/_lib/authGuard.ts y nota en functions/api/admin/reservas.ts.
//
// Configuración: una env var por alojamiento con la URL del .ics que exporta
// Airbnb (Host → Calendario → Sincronizar calendarios → Exportar calendario):
//   AIRBNB_ICS_URL_1  → para el alojamiento id=1 (Domo 1)
//   AIRBNB_ICS_URL_2  → para el alojamiento id=2 (Domo 2)
//   AIRBNB_ICS_URL_3  → para el alojamiento id=3 (Refugio)
// Si un alojamiento no tiene su env var configurada, se lo salta (no es error).
//
// Upsert por ical_uid: si el UID del evento de Airbnb ya existe en D1,
// actualiza fechas/estado; si no existe, crea una reserva nueva. Los datos
// que Airbnb NO expone en su calendario (nombre real del huésped, teléfono,
// cantidad de personas, monto) quedan con placeholders — hay que completarlos
// a mano desde el Panel de Reservas (Editar reserva).
//
// Cancelaciones: si una reserva que ya habíamos sincronizado (canal_origen
// ='Airbnb') deja de aparecer en el feed de Airbnb para fechas futuras, se
// asume cancelada en Airbnb y se marca estado='cancelada' acá también.

import { parseIcs } from '../../_lib/ical';
import { requirePermission } from '../../_lib/authGuard';
import { registrarAuditoria } from '../../_lib/auditoria';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Si Airbnb no manda un SUMMARY útil (lo más común: "Reserved" / "Airbnb
// (Not available)" / vacío, por privacidad), usamos un placeholder claro en
// vez de guardar "Reserved" como si fuera el nombre real del huésped.
function nombreDesdeSummary(summary: string): string {
  const limpio = summary.trim();
  if (!limpio || /^(reserved|not available|airbnb|blocked|closed)/i.test(limpio)) {
    return 'Huésped de Airbnb (completar nombre)';
  }
  return limpio;
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'integraciones.airbnb.sincronizar');
  if (auth instanceof Response) return auth;

  const db = env.DB;
  const { results: alojamientos } = await db.prepare('SELECT id, nombre FROM alojamientos ORDER BY id ASC').all();

  const hoy = new Date().toISOString().slice(0, 10);
  const resumen: Record<string, any> = {};

  for (const aloj of alojamientos || []) {
    const icsUrl = env[`AIRBNB_ICS_URL_${aloj.id}`];
    if (!icsUrl) continue; // no configurado para este alojamiento — se salta, no es error

    let nuevas = 0;
    let actualizadas = 0;
    let canceladas = 0;
    let error: string | null = null;
    const uidsVistos: string[] = [];

    try {
      const res = await fetch(icsUrl);
      if (!res.ok) throw new Error(`el .ics respondió ${res.status}`);
      const texto = await res.text();
      const eventos = parseIcs(texto);

      for (const ev of eventos) {
        uidsVistos.push(ev.uid);

        const existente: any = await db
          .prepare('SELECT id, fecha_checkin, fecha_checkout, estado FROM reservas WHERE ical_uid = ?')
          .bind(ev.uid)
          .first();

        if (existente) {
          if (existente.fecha_checkin !== ev.dtstart || existente.fecha_checkout !== ev.dtend || existente.estado === 'cancelada') {
            await db
              .prepare(`UPDATE reservas SET fecha_checkin = ?, fecha_checkout = ?, estado = 'confirmada' WHERE id = ?`)
              .bind(ev.dtstart, ev.dtend, existente.id)
              .run();
            actualizadas++;
          }
        } else {
          await db
            .prepare(
              `INSERT INTO reservas
                (cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas, monto_total, estado, canal_origen, ical_uid)
               VALUES (?, ?, ?, ?, 1, 0, 'confirmada', 'Airbnb', ?)`
            )
            .bind(nombreDesdeSummary(ev.summary), aloj.id, ev.dtstart, ev.dtend, ev.uid)
            .run();
          nuevas++;
        }
      }

      // Lo que ya no está en el feed de Airbnb (para fechas futuras) se
      // considera cancelado del lado de Airbnb.
      const placeholders = uidsVistos.length > 0 ? uidsVistos.map(() => '?').join(',') : "''";
      const { results: faltantes } = await db
        .prepare(
          `SELECT id FROM reservas
           WHERE alojamiento_id = ? AND canal_origen = 'Airbnb' AND estado != 'cancelada'
           AND fecha_checkin >= ? AND ical_uid IS NOT NULL AND ical_uid NOT IN (${placeholders})`
        )
        .bind(aloj.id, hoy, ...uidsVistos)
        .all();

      for (const f of faltantes || []) {
        await db.prepare(`UPDATE reservas SET estado = 'cancelada' WHERE id = ?`).bind((f as any).id).run();
        canceladas++;
      }
    } catch (e: any) {
      error = e.message || 'Error al sincronizar.';
    }

    resumen[aloj.nombre] = error ? { error } : { nuevas, actualizadas, canceladas };
  }

  if (Object.keys(resumen).length === 0) {
    return json({ error: 'No hay ninguna AIRBNB_ICS_URL_<id> configurada — nada para sincronizar.' }, 400);
  }

  const detalle = Object.entries(resumen)
    .map(([nombre, r]: [string, any]) => ('error' in r ? `${nombre}: error` : `${nombre}: +${r.nuevas}/~${r.actualizadas}/-${r.canceladas}`))
    .join(' · ');
  await registrarAuditoria(db, {
    email: auth.email,
    accion: 'sync_airbnb',
    entidadTipo: 'integracion',
    entidadId: 'airbnb',
    metadata: { alojamientos: Object.keys(resumen).length, resumen: detalle },
  });

  return json({ ok: true, resumen });
}
