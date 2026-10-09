import { ErrorReserva } from './errors.ts';

export type EstadoCuentaCobro =
  | 'pending'
  | 'provisioning'
  | 'ready'
  | 'failed'
  | 'disabled'
  | 'unknown_outcome';

export type CuentaCobroReserva = {
  id: number;
  reservaId: number;
  proveedor: 'cucuru';
  customerId: string;
  estado: EstadoCuentaCobro;
  externalAccountId: string | null;
  cvu: string | null;
  alias: string | null;
  moneda: string;
  intentos: number;
  operacionUid: string;
  errorCodigo: string | null;
  nextRetryAt: string | null;
  simulada: boolean;
};

export type DestinoCobroProveedor = {
  externalAccountId: string;
  customerId: string;
  cvu: string;
  alias: string | null;
  moneda: string;
};

export type CollectionCucuruNormalizada = {
  collectionId: string;
  collectorId: string;
  customerId: string | null;
  externalAccountId: string | null;
  cvu: string | null;
  montoCentavos: number;
  moneda: string;
  occurredAt: string;
  payloadHash: string;
};

export function cucuruHabilitado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim().toLowerCase() === 'true';
}

export function customerIdCuentaCobro(reservaUid: string): string {
  const normalizado = reservaUid.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalizado)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La referencia opaca de la reserva es inválida.');
  }
  return `pm-reserva-${normalizado}`;
}

export function aliasCuentaCobro(reservaId: number, prefijo: unknown): string {
  const base = typeof prefijo === 'string' ? prefijo.trim().toLowerCase() : '';
  if (!Number.isSafeInteger(reservaId) || reservaId <= 0 || !/^[a-z0-9.-]{3,16}$/.test(base)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La configuración de alias Cucuru es inválida.');
  }
  const alias = `${base}.reserva${reservaId}`;
  if (alias.length > 20) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El alias Cucuru excede la longitud permitida.');
  }
  return alias;
}

export function validarDestinoCobro(destino: DestinoCobroProveedor): DestinoCobroProveedor {
  const externalAccountId = destino.externalAccountId?.trim();
  const customerId = destino.customerId?.trim();
  const cvu = destino.cvu?.trim();
  const alias = destino.alias?.trim() || null;
  const moneda = destino.moneda?.trim().toUpperCase();
  if (!externalAccountId || !customerId || !/^\d{22}$/.test(cvu) || !/^[A-Z]{3}$/.test(moneda)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El destino de cobro del proveedor es inválido.');
  }
  return { externalAccountId, customerId, cvu, alias, moneda };
}

export class ErrorProvisionamientoDesconocido extends Error {
  constructor() {
    super('El proveedor no confirmó el resultado del provisionamiento.');
    this.name = 'ErrorProvisionamientoDesconocido';
  }
}
