type Limite = { permitido: boolean; reintentarEn: number };
const SALT_FALLBACK = 'pueblo-magico-reservas-rate-limit-v1';

async function sha256(valor: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function consumirLimite(
  request: Request,
  env: any,
  ruta: string,
  maximo: number,
  ventanaSegundos: number,
  sujeto?: string
): Promise<Limite> {
  const salt = typeof env.RATE_LIMIT_SALT === 'string' && env.RATE_LIMIT_SALT.length >= 16
    ? env.RATE_LIMIT_SALT
    : (typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length >= 16
      ? env.SESSION_SECRET
      : SALT_FALLBACK);
  if (!env.DB) {
    return { permitido: false, reintentarEn: ventanaSegundos };
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const bucketHash = await sha256(`${salt}:${sujeto || ip}`);
  const ahora = Math.floor(Date.now() / 1000);
  const inicio = ahora - (ahora % ventanaSegundos);
  const vence = inicio + ventanaSegundos;
  const row: any = await env.DB.prepare(`
    INSERT INTO rate_limit_counters (bucket_hash, ruta, window_start, cantidad, expires_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT (bucket_hash, ruta, window_start)
    DO UPDATE SET cantidad = cantidad + 1
    RETURNING cantidad
  `).bind(bucketHash, ruta, inicio, vence).first();
  return { permitido: Number(row?.cantidad || 0) <= maximo, reintentarEn: Math.max(1, vence - ahora) };
}

export function respuestaLimite(limite: Limite): Response | null {
  if (limite.permitido) return null;
  return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Probá nuevamente más tarde.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(limite.reintentarEn) },
  });
}
