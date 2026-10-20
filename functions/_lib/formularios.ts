// Piezas compartidas por los endpoints públicos de formularios:
// functions/api/interes.ts (eventos) y functions/api/formulario.ts (contacto
// y descargas). CORS/origen, hash de IP para limitar envíos, chequeo de que el
// dominio del mail reciba correo, y envío de mails por Resend.

export const ALLOWED_ORIGINS = ['https://experienciamagico.com', 'https://www.experienciamagico.com'];
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const origenPermitido = (origin: string) => ALLOWED_ORIGINS.includes(origin) || LOCALHOST_ORIGIN.test(origin);

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origenPermitido(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Hash de la IP (nunca guardamos la IP en sí) para contar envíos por conexión.
export async function hashIp(request: Request, env: any): Promise<string | null> {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return null;
  const datos = new TextEncoder().encode(`${env.SESSION_SECRET || 'pueblo-magico'}:${ip}`);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(hash)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ¿El dominio del mail recibe correo? DNS-over-HTTPS de Cloudflare (gratis).
// Si la consulta falla por red, no frenamos a nadie: solo rechaza un "no existe".
export async function dominioRecibeMail(email: string): Promise<boolean> {
  const dominio = email.split('@')[1];
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dominio)}&type=MX`, {
      headers: { accept: 'application/dns-json' },
    });
    if (!res.ok) return true;
    const data: any = await res.json();
    if (data.Status === 3) return false;                                       // NXDOMAIN: el dominio no existe
    return Array.isArray(data.Answer) && data.Answer.some((a: any) => a.type === 15);
  } catch {
    return true;
  }
}

export async function enviarMail(env: any, to: string[], subject: string, html: string, replyTo?: string) {
  if (!env.RESEND_API_KEY || to.length === 0) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM || 'Pueblo Mágico <onboarding@resend.dev>',
        to, subject, html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
  } catch { /* best-effort: el registro ya quedó en D1 */ }
}

export const destinatariosAviso = (env: any): string[] =>
  String(env.NOTIFY_EMAIL || '').split(',').map((s: string) => s.trim()).filter(Boolean);

export function tablaHtml(datos: Record<string, string | number | null | undefined>) {
  return '<table>' + Object.entries(datos)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(String(v ?? '—')).replace(/\n/g, '<br>')}</strong></td></tr>`)
    .join('') + '</table>';
}
