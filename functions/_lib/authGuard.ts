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

import { readCookie, verifySessionToken, COOKIE_NAME, CSRF_COOKIE_NAME } from './session.ts';
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
  if (typeof env.SESSION_SECRET !== 'string' || env.SESSION_SECRET.length < 32) {
    return json({ error: 'Autenticación no disponible.' }, 503);
  }
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return json({ error: 'No autenticado.' }, 401);

  const session = await verifySessionToken(token, env.SESSION_SECRET);
  if (!session) return json({ error: 'Sesión inválida o vencida.' }, 401);

  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    const header = request.headers.get('X-CSRF-Token');
    const cookie = readCookie(request, CSRF_COOKIE_NAME);
    if (!header || !cookie || header.length !== session.csrf.length || cookie !== session.csrf) {
      return json({ error: 'Solicitud inválida.' }, 403);
    }
    let diferencia = 0;
    for (let i = 0; i < header.length; i++) diferencia |= header.charCodeAt(i) ^ session.csrf.charCodeAt(i);
    if (diferencia !== 0) return json({ error: 'Solicitud inválida.' }, 403);
  }

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
