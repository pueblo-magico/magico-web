// Cloudflare Pages Function — cierra la sesión del Panel de Reservas
// borrando la cookie. Ver functions/api/admin/login.ts.

import { requireAuth } from '../../_lib/authGuard.ts';
import { clearCsrfCookieHeader, clearSessionCookieHeader } from '../../_lib/session';

export async function onRequestPost({ request, env }: any) {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', clearSessionCookieHeader());
  headers.append('Set-Cookie', clearCsrfCookieHeader());
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
}
