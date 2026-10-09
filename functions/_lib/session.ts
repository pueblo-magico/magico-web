// Sesión del Panel de Reservas — token firmado con HMAC-SHA256 guardado en
// una cookie HttpOnly, en reemplazo del One-Time PIN por email de Cloudflare
// Access. No es JWT (evita traer una librería) pero usa la misma idea:
// payload + firma, ambos en base64url, separados por un punto.

export const COOKIE_NAME = 'pm_admin_session';
export const CSRF_COOKIE_NAME = 'pm_admin_csrf';
const SESSION_DIAS = 30;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + ((4 - (s.length % 4)) % 4), '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(email: string, secret: string, csrf: string = crypto.randomUUID()): Promise<string> {
  const payload = JSON.stringify({
    email,
    csrf,
    sid: crypto.randomUUID(),
    exp: Date.now() + SESSION_DIAS * 86_400_000,
    version: 1,
  });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await hmacKey(secret);
  const firma = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(firma))}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<{ email: string; csrf: string; sid: string } | null> {
  try {
    const [payloadB64, sigB64, extra] = token.split('.');
    if (!payloadB64 || !sigB64 || extra) return null;
    const key = await hmacKey(secret);
    const valida = await crypto.subtle.verify('HMAC', key, fromBase64Url(sigB64) as BufferSource, new TextEncoder().encode(payloadB64));
    if (!valida) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (typeof payload.email !== 'string' || typeof payload.exp !== 'number' ||
        typeof payload.csrf !== 'string' || typeof payload.sid !== 'string' || payload.version !== 1) return null;
    if (Date.now() > payload.exp) return null;
    return { email: payload.email, csrf: payload.csrf, sid: payload.sid };
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DIAS * 86_400}`;
}

export function csrfCookieHeader(csrf: string): string {
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(csrf)}; Path=/; Secure; SameSite=Strict; Max-Age=${SESSION_DIAS * 86_400}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function clearCsrfCookieHeader(): string {
  return `${CSRF_COOKIE_NAME}=; Path=/; Secure; SameSite=Strict; Max-Age=0`;
}
