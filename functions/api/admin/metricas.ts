// Cloudflare Pages Function — métricas operativas para contabilidad: total
// de personas y noches por tipo_estadia (huésped vs. staff/voluntario/
// residente), para cruzar volumen de gente alojada/alimentada contra gastos
// reales (supermercado, etc.). Alimenta la sección "Métricas Operativas" del
// Panel de Reservas.
//
// Regla de negocio: NO es todo el historial — solo reservas con check-in
// desde el 2026-08-06 en adelante, y excluye canceladas (nunca ocurrieron).
//
// Protegido por sesión propia — ver functions/_lib/authGuard.ts. Cualquier
// rol autenticado puede verlo (son datos agregados, no reservas
// individuales), igual que el resto de la pestaña Métricas.

import { requirePermission } from '../../_lib/authGuard';

const FECHA_DESDE = '2026-08-06';

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'metricas.leer');
  if (auth instanceof Response) return auth;

  const { results } = await env.DB
    .prepare(
      `SELECT
         tipo_estadia,
         SUM(cantidad_personas) AS total_personas,
         SUM(julianday(fecha_checkout) - julianday(fecha_checkin)) AS total_noches
       FROM reservas
       WHERE estado != 'cancelada'
         AND DATE(fecha_checkin) >= DATE(?)
       GROUP BY tipo_estadia`
    )
    .bind(FECHA_DESDE)
    .all();

  return new Response(JSON.stringify({ desde: FECHA_DESDE, grupos: results || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
