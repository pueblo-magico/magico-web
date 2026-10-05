// Guard de sesión y rol para los endpoints /api/admin/*. Reemplaza a
// Cloudflare Zero Trust Access como única protección real de estas rutas —
// ver el login en functions/api/admin/login.ts.
//
// requireAuth vuelve a consultar D1 en cada request (no confía solo en la
// cookie) para que desactivar a alguien o cambiarle el rol tenga efecto
// inmediato, sin esperar a que expire su sesión de 30 días.
//
// Uso en cada handler:
//   const auth = await requireAuth(request, env);
//   if (auth instanceof Response) return auth;
//
// Para acciones restringidas a ciertos roles:
//   const auth = await requireRole(request, env, ['super_admin', 'editor']);
//   if (auth instanceof Response) return auth;

import { readCookie, verifySessionToken, COOKIE_NAME } from './session';
import {
  rolTienePermiso,
  type PermisoAdmin,
  type RolAdmin,
} from '../_domain/reservas/adminPermissions.ts';

export type Rol = RolAdmin;
export type Auth = { email: string; rol: Rol };
export type Permiso = PermisoAdmin;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function requireAuth(request: Request, env: any): Promise<Auth | Response> {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return json({ error: 'No autenticado.' }, 401);

  const session = await verifySessionToken(token, env.SESSION_SECRET);
  if (!session) return json({ error: 'Sesión inválida o vencida.' }, 401);

  const usuario: any = await env.DB
    .prepare(`SELECT email, rol, activo FROM usuarios_admin WHERE LOWER(email) = ?`)
    .bind(session.email.toLowerCase())
    .first();

  if (!usuario || !usuario.activo) return json({ error: 'Sesión inválida o vencida.' }, 401);

  return { email: usuario.email, rol: usuario.rol };
}

export async function requireRole(request: Request, env: any, rolesPermitidos: Rol[]): Promise<Auth | Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!rolesPermitidos.includes(auth.rol)) return json({ error: 'No tenés permiso para esta acción.' }, 403);
  return auth;
}

export function tienePermiso(auth: Auth, permiso: Permiso): boolean {
  return rolTienePermiso(auth.rol, permiso);
}

export async function requirePermission(
  request: Request,
  env: any,
  permiso: Permiso
): Promise<Auth | Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!tienePermiso(auth, permiso)) {
    return json({ error: 'No tenés permiso para esta acción.' }, 403);
  }
  return auth;
}
