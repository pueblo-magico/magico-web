export type ConfiguracionTransferenciaMp = {
  habilitada: boolean;
  alias: string;
  cvu: string;
  titular: string;
};

export function configuracionTransferenciaMp(env: any): ConfiguracionTransferenciaMp {
  const alias = typeof env.MP_TRANSFER_ALIAS === 'string' ? env.MP_TRANSFER_ALIAS.trim() : '';
  const cvu = typeof env.MP_TRANSFER_CVU === 'string' ? env.MP_TRANSFER_CVU.replace(/\s/g, '') : '';
  const titular = typeof env.MP_TRANSFER_ACCOUNT_HOLDER === 'string'
    ? env.MP_TRANSFER_ACCOUNT_HOLDER.trim()
    : '';
  const secretoValido = typeof env.PAYMENT_RECONCILIATION_SECRET === 'string' &&
    env.PAYMENT_RECONCILIATION_SECRET.trim().length >= 32;
  return {
    habilitada: env.MP_TRANSFER_ENABLED === 'true' && secretoValido &&
      (alias.length > 0 || /^\d{22}$/.test(cvu)),
    alias,
    cvu: /^\d{22}$/.test(cvu) ? cvu : '',
    titular,
  };
}

export function checkoutMercadoPagoHabilitado(env: any): boolean {
  return env.MP_CHECKOUT_ENABLED === 'true' &&
    typeof env.MP_ACCESS_TOKEN === 'string' && env.MP_ACCESS_TOKEN.trim().length > 0;
}
