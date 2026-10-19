// Cloudflare Pages Function — link "Confirmar mi mail" del mail de
// confirmación que manda functions/api/interes.ts. Marca el registro como
// confirmado (prueba que el mail es real) y vuelve a la landing, que muestra
// el aviso de confirmado con ?confirmado=1 / ?confirmado=0.

const PATHS: Record<string, string> = { 'sunset-y-rio': '/sunset-y-rio' };

export async function onRequestGet({ request, env }: any) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const volver = (path: string, ok: boolean) => Response.redirect(`${url.origin}${path}?confirmado=${ok ? 1 : 0}`, 302);

  if (!/^[0-9a-f-]{36}$/.test(token)) return volver('/', false);

  const row: any = await env.DB
    .prepare('SELECT id, evento FROM registros_eventos WHERE token = ?')
    .bind(token)
    .first();
  if (!row) return volver('/', false);

  await env.DB
    .prepare(`UPDATE registros_eventos SET email_confirmado_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND email_confirmado_at IS NULL`)
    .bind(row.id)
    .run();

  return volver(PATHS[row.evento] || '/', true);
}
