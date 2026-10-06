export type AlcanceServicio =
  | 'reservas:crear'
  | 'reservas:leer'
  | 'reservas:expirar'
  | 'pagos:notificar'
  | 'stock:leer';

const IDENTIDADES = {
  manychat: { env: 'MANYCHAT_INBOUND_SECRET', alcances: ['reservas:crear'] },
  n8n: { env: 'N8N_INBOUND_SECRET', alcances: ['reservas:crear', 'reservas:leer', 'reservas:expirar'] },
  accounting: { env: 'ACCOUNTING_API_SECRET', alcances: ['reservas:leer'] },
  stock: { env: 'STOCK_API_SECRET', alcances: ['stock:leer'] },
} as const;

function igualesConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export function autenticarServicio(
  identidad: keyof typeof IDENTIDADES,
  secretoRecibido: string | null,
  env: Record<string, unknown>,
  alcance: AlcanceServicio
): boolean {
  const configuracion = IDENTIDADES[identidad];
  const secreto = env[configuracion.env];
  return typeof secreto === 'string' && secreto.length >= 24 &&
    (configuracion.alcances as readonly string[]).includes(alcance) &&
    typeof secretoRecibido === 'string' && igualesConstante(secretoRecibido, secreto);
}
