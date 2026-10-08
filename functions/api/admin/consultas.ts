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
      `SELECT c.id, c.codigo, c.cliente_nombre, c.cliente_telefono, c.cliente_email,
              c.alojamiento_interes, c.fecha_desde, c.fecha_hasta, c.cantidad_personas,
              c.monto_estimado, c.monto_estimado_centavos, c.subscriber_id,
              c.canal_origen, c.fecha_consulta, c.created_at,
              cot.codigo cotizacion_codigo,
              cir.contacto_ref, cir.conversacion_ref
       FROM consultas c
       LEFT JOIN cotizaciones cot ON cot.id = c.cotizacion_id
       LEFT JOIN consulta_integracion_referencias cir ON cir.consulta_id = c.id
       ORDER BY c.fecha_consulta DESC`
    )
    .all();

  return json({ consultas: results || [] });
}
