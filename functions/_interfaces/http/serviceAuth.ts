export type AlcanceServicio =
  | 'reservas:disponibilidad'
  | 'reservas:cotizar'
  | 'reservas:crear'
  | 'reservas:leer'
  | 'reservas:expirar'
  | 'pagos:notificar'
  | 'pagos:conciliar'
  | 'integraciones:despachar'
  | 'stock:leer';

const IDENTIDADES = {
  manychat: {
    env: 'MANYCHAT_INBOUND_SECRET',
    alcances: ['reservas:disponibilidad', 'reservas:cotizar', 'reservas:crear'],
  },
  n8n: {
    env: 'N8N_INBOUND_SECRET',
    alcances: [
      'reservas:disponibilidad', 'reservas:cotizar', 'reservas:crear',
      'reservas:leer', 'reservas:expirar', 'pagos:conciliar',
    ],
  },
  accounting: { env: 'ACCOUNTING_API_SECRET', alcances: ['reservas:leer'] },
  stock: { env: 'STOCK_API_SECRET', alcances: ['stock:leer'] },
  outbox: { env: 'OUTBOX_DISPATCH_SECRET', alcances: ['integraciones:despachar'] },
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
