// Cloudflare Pages Function — registro de actividad del Panel de Reservas
// (quién hizo qué: crear/editar/cancelar reserva, asignar cama, sync Airbnb,
// alta/baja/reseteo de usuarios). Solo super_admin. Ver
// functions/_lib/auditoria.ts para dónde se generan estos registros.

import { requirePermission } from '../../_lib/authGuard';

const LIMITE = 200;

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'auditoria.leer');
  if (auth instanceof Response) return auth;

  const { results } = await env.DB
    .prepare(`SELECT id, email, accion, entidad_tipo, entidad_id, motivo, metadata_json, created_at
              FROM auditoria_admin ORDER BY created_at DESC LIMIT ?`)
    .bind(LIMITE)
    .all();

  return new Response(JSON.stringify({ registros: results || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
