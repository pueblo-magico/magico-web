import { ErrorReserva } from './errors.ts';
import { validarMotivoCambioSensible } from './adminReservationManagement.ts';

export type TipoPagoManual = 'sena' | 'saldo' | 'total';
export type MetodoPagoManual =
  | 'efectivo'
  | 'transferencia_mp'
  | 'transferencia_bancaria'
  | 'mercado_pago'
  | 'otro';

export type RegistroPagoManual = {
  reservaId: number;
  expectedVersion: number;
  tipo: TipoPagoManual;
  metodo: MetodoPagoManual;
  montoCentavos: number;
  moneda: string;
  referencia: string | null;
  pagadoAt: string;
  motivo: string;
  idempotencyKey: string;
  actorEmail: string;
  correlationId: string;
};

export type ResumenPagoManual = {
  pagoId: number;
  reservaId: number;
  reservaVersion: number;
  estadoReserva: string;
  reservaConfirmada: boolean;
  totalCentavos: number;
  pagadoCentavos: number;
  saldoCentavos: number;
  moneda: string;
};

const TIPOS: readonly TipoPagoManual[] = ['sena', 'saldo', 'total'];
const METODOS: readonly MetodoPagoManual[] = [
  'efectivo', 'transferencia_mp', 'transferencia_bancaria', 'mercado_pago', 'otro',
];

function textoOpcional(valor: unknown, maximo: number): string | null {
  if (valor == null || valor === '') return null;
  if (typeof valor !== 'string' || valor.trim().length > maximo) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La referencia del pago es inválida.');
  }
  return valor.trim() || null;
}

export function validarRegistroPagoManual(
  entrada: Omit<RegistroPagoManual, 'motivo' | 'pagadoAt'> & { motivo: unknown; pagadoAt: unknown }
): RegistroPagoManual {
  if (!Number.isSafeInteger(entrada.reservaId) || entrada.reservaId < 1 ||
      !Number.isSafeInteger(entrada.expectedVersion) || entrada.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva o su versión es inválida.');
  }
  if (!TIPOS.includes(entrada.tipo)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El concepto del pago es inválido.');
  }
  if (!METODOS.includes(entrada.metodo)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El método de pago es inválido.');
  }
  if (!Number.isSafeInteger(entrada.montoCentavos) || entrada.montoCentavos <= 0) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El importe debe ser mayor que cero.');
  }
  const moneda = entrada.moneda?.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La moneda es inválida.');
  }
  if (typeof entrada.pagadoAt !== 'string' || !entrada.pagadoAt.trim()) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Indicá la fecha del pago.');
  }
  const instantePago = new Date(entrada.pagadoAt);
  if (!Number.isFinite(instantePago.getTime()) || instantePago.getTime() > Date.now() + 5 * 60_000) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La fecha del pago es inválida o está en el futuro.');
  }
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(entrada.idempotencyKey)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La clave de registro del pago es inválida.');
  }
  if (typeof entrada.actorEmail !== 'string' || !entrada.actorEmail.trim()) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'No se pudo identificar al administrador.');
  }
  return {
    ...entrada,
    moneda,
    referencia: textoOpcional(entrada.referencia, 160),
    pagadoAt: instantePago.toISOString(),
    motivo: validarMotivoCambioSensible(entrada.motivo),
    actorEmail: entrada.actorEmail.trim().toLowerCase(),
  };
}
