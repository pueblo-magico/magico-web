// Cloudflare Pages Function — pestaña "Consultas" del Dashboard interno.
//
// Trae los leads de la tabla `consultas`: gente que llegó al último estadio
// del flujo de ManyChat (fecha, alojamiento y monto ya cotizados) pero nunca
// completó el pago. Separado de /api/admin/reservas a propósito — ver
// add_consultas.sql para el motivo de la tabla aparte.

import { requirePermission } from '../../_lib/authGuard';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'consultas.leer');
  if (auth instanceof Response) return auth;

  const db = env.DB;

  const { results } = await db
    .prepare(
      `SELECT id, cliente_nombre, cliente_telefono, alojamiento_interes,
              fecha_desde, fecha_hasta, cantidad_personas, monto_estimado,
              subscriber_id, fecha_consulta, created_at
       FROM consultas
       ORDER BY fecha_consulta DESC`
    )
    .all();

  return json({ consultas: results || [] });
}
