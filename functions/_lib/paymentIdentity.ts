export function normalizarDni(valor: unknown): string | null {
  if (typeof valor !== 'string' && typeof valor !== 'number') return null;
  const original = String(valor).trim();
  if (!/^[\d.\s-]+$/.test(original)) return null;
  const digitos = original.replace(/\D/g, '');
  return /^\d{7,8}$/.test(digitos) ? digitos : null;
}

export async function hashDni(dni: string, secreto: string): Promise<string> {
  if (secreto.trim().length < 32) throw new Error('PAYMENT_RECONCILIATION_SECRET_INVALIDO');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', key, encoder.encode(dni));
  return Array.from(new Uint8Array(firma), byte => byte.toString(16).padStart(2, '0')).join('');
}
