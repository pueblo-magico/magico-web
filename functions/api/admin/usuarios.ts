// Cloudflare Pages Function — alta/reseteo/baja/cambio de rol de usuarios
// del Panel de Reservas, desde la pestaña "Usuarios" (solo super_admin).
// Reemplaza tener que tocar código o correr wrangler d1 execute cada vez que
// entra o sale un compañero del equipo (el único caso que sigue necesitando
// la terminal es el primer usuario — ver scripts/crear-usuario-admin.mjs).
//
// Roles: 'super_admin' (todo, incluida esta pantalla), 'editor' (todo menos
// esta pantalla y Actividad), 'viewer' (solo ver Operativa/Métricas/Historial).

import { requirePermission } from '../../_lib/authGuard';
import { hashPassword } from '../../_lib/passwords';
import { registrarAuditoria } from '../../_lib/auditoria';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../_interfaces/http/requestSecurity.ts';

const ROLES_VALIDOS = ['super_admin', 'editor', 'viewer'];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestGet({ request, env }: any) {
  const auth = await requirePermission(request, env, 'usuarios.gestionar');
  if (auth instanceof Response) return auth;

  const { results } = await env.DB
    .prepare(`SELECT id, email, rol, activo, created_at FROM usuarios_admin ORDER BY created_at ASC`)
    .all();
  return json({ usuarios: results || [] });
}

export async function onRequestPost({ request, env }: any) {
  const auth = await requirePermission(request, env, 'usuarios.gestionar');
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await leerJsonSeguro(request, 16 * 1024);
  } catch (error) {
    return respuestaJsonInvalido(error);
  }

  const db = env.DB;
  const accion = body?.accion;

  if (accion === 'crear') {
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const rol = String(body?.rol || 'editor');
    if (!email || !email.includes('@')) return json({ error: 'Email inválido.' }, 400);
    if (password.length < 12) return json({ error: 'La contraseña debe tener al menos 12 caracteres.' }, 400);
    if (!ROLES_VALIDOS.includes(rol)) return json({ error: `rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.` }, 400);

    const hash = await hashPassword(password);
    try {
      const inserted: any = await db
        .prepare(`INSERT INTO usuarios_admin (email, password_hash, rol) VALUES (?, ?, ?) RETURNING id, email, rol, activo, created_at`)
        .bind(email, hash, rol)
        .first();
      await registrarAuditoria(db, { email: auth.email, accion: 'crear_usuario', entidadTipo: 'usuario_admin', entidadId: inserted.id, metadata: { rol } });
      return json({ ok: true, usuario: inserted });
    } catch (e: any) {
      const yaExiste = String(e.message || '').includes('UNIQUE');
      return json({ error: yaExiste ? 'Ya existe un usuario con ese email.' : 'No se pudo crear el usuario.' }, 400);
    }
  }

  const id = Number(body?.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: 'id inválido.' }, 400);

  if (accion === 'resetear_password') {
    const password = String(body?.password || '');
    if (password.length < 12) return json({ error: 'La contraseña debe tener al menos 12 caracteres.' }, 400);
    const hash = await hashPassword(password);
    const row: any = await db
      .prepare(`UPDATE usuarios_admin SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ? RETURNING id, email`)
      .bind(hash, id)
      .first();
    if (!row) return json({ error: 'No existe ese usuario.' }, 404);
    await registrarAuditoria(db, { email: auth.email, accion: 'resetear_password', entidadTipo: 'usuario_admin', entidadId: row.id });
    return json({ ok: true });
  }

  if (accion === 'cambiar_rol') {
    const rol = String(body?.rol || '');
    if (!ROLES_VALIDOS.includes(rol)) return json({ error: `rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.` }, 400);

    const objetivo: any = await db.prepare(`SELECT email FROM usuarios_admin WHERE id = ?`).bind(id).first();
    if (!objetivo) return json({ error: 'No existe ese usuario.' }, 404);
    if (objetivo.email.toLowerCase() === auth.email.toLowerCase()) {
      return json({ error: 'No podés cambiar tu propio rol.' }, 400);
    }

    await db.prepare(`UPDATE usuarios_admin SET rol = ? WHERE id = ?`).bind(rol, id).run();
    await registrarAuditoria(db, { email: auth.email, accion: 'cambiar_rol', entidadTipo: 'usuario_admin', entidadId: id, metadata: { rol } });
    return json({ ok: true });
  }

  if (accion === 'desactivar' || accion === 'reactivar') {
    if (accion === 'desactivar') {
      const objetivo: any = await db.prepare(`SELECT email FROM usuarios_admin WHERE id = ?`).bind(id).first();
      if (!objetivo) return json({ error: 'No existe ese usuario.' }, 404);
      if (objetivo.email.toLowerCase() === auth.email.toLowerCase()) {
        return json({ error: 'No podés desactivar tu propia cuenta.' }, 400);
      }
    }
    const row: any = await db
      .prepare(`UPDATE usuarios_admin SET activo = ? WHERE id = ? RETURNING id, email`)
      .bind(accion === 'reactivar' ? 1 : 0, id)
      .first();
    if (!row) return json({ error: 'No existe ese usuario.' }, 404);
    await registrarAuditoria(db, { email: auth.email, accion: accion === 'reactivar' ? 'reactivar_usuario' : 'desactivar_usuario', entidadTipo: 'usuario_admin', entidadId: row.id });
    return json({ ok: true });
  }

  return json({ error: "accion debe ser 'crear', 'resetear_password', 'cambiar_rol', 'desactivar' o 'reactivar'." }, 400);
}
