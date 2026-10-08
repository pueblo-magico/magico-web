import type { ProveedorCuentasCobro } from '../../_application/reservas/ports.ts';
import type { DestinoCobroProveedor } from '../../_domain/reservas/collectionAccounts.ts';

function destinoDeterminista(customerId: string): DestinoCobroProveedor {
  const uuid = customerId.replace(/^pm-reserva-/, '');
  const hex = uuid.replaceAll('-', '');
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error('MOCK_CUSTOMER_ID_INVALIDO');
  const numero = (BigInt(`0x${hex}`) % (10n ** 20n)).toString().padStart(20, '0');
  return {
    externalAccountId: `mock-${hex.slice(-16)}`,
    customerId,
    cvu: `99${numero}`,
    alias: null,
    moneda: 'ARS',
  };
}

/** Adaptador determinista para desarrollo y Preview. No realiza llamadas de red. */
export class CucuruProveedorCuentasCobroMock implements ProveedorCuentasCobro {
  async buscarPorCustomerId(): Promise<DestinoCobroProveedor | null> {
    return null;
  }

  async crear({ customerId }: { customerId: string }): Promise<DestinoCobroProveedor> {
    return destinoDeterminista(customerId);
  }

  async asignarAlias({
    cuenta,
    alias,
  }: {
    cuenta: DestinoCobroProveedor;
    alias: string;
  }): Promise<DestinoCobroProveedor> {
    return { ...cuenta, alias };
  }
}

export type ModoCuentasCobro = 'disabled' | 'real' | 'mock';

export function resolverModoCuentasCobro(env: Record<string, unknown>): ModoCuentasCobro {
  const habilitada = String(env.CUCURU_TRANSFER_ENABLED || '').trim().toLowerCase() === 'true';
  if (!habilitada) return 'disabled';

  const modo = String(env.CUCURU_PROVIDER_MODE || 'real').trim().toLowerCase();
  if (modo === 'real') return 'real';
  if (modo === 'mock') {
    const permitido = String(env.CUCURU_MOCK_ALLOWED || '').trim().toLowerCase() === 'true';
    if (!permitido) throw new Error('CUCURU_MOCK_NO_PERMITIDO');
    return 'mock';
  }
  throw new Error('CUCURU_PROVIDER_MODE_INVALIDO');
}
