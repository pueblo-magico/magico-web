import { ErrorReserva } from './errors.ts';

export const PAYMENT_HOLD_MINUTES = {
  codigo: 'payment_hold_minutes',
  fallback: 15,
  minimo: 5,
  maximo: 120,
  unidad: 'minutos',
} as const;

export type ParametroOperativoReserva = {
  codigo: typeof PAYMENT_HOLD_MINUTES.codigo;
  valor: number;
  unidad: typeof PAYMENT_HOLD_MINUTES.unidad;
  version: number;
  minimo: number;
  maximo: number;
  editable: boolean;
  fuente: 'parametros_operativos_reservas' | 'fallback_seguro';
  actualizadoAt: string;
};

export type ConfiguracionBaseReservas = {
  parametros: ParametroOperativoReserva[];
  inventario: Array<{
    codigo: string;
    nombre: string;
    tipo: string;
    capacidadComercial: number;
    capacidadOperativaMaxima: number;
    estado: string;
    modalidades: Array<{ modalidad: string; contexto: string; unidadVenta: string }>;
  }>;
  tarifa: null | {
    codigo: string;
    nombre: string;
    moneda: string;
    version: number;
    reglasPrecio: number;
    reglasSena: number;
    publicadoAt: string;
  };
  politicaCancelacion: null | {
    codigo: string;
    nombre: string;
    version: number;
    estado: string;
    vigenciaDesde: string | null;
  };
  alimentacion: Array<{
    codigo: string;
    moneda: string;
    version: number;
    precioComidaCentavos: number;
    comidasAdicionalesPorPersonaNoche: number;
  }>;
};

export type CambioParametroOperativo = {
  codigo: typeof PAYMENT_HOLD_MINUTES.codigo;
  valor: number;
  expectedVersion: number;
  motivo: string;
};

export function validarCambioParametroOperativo(entrada: CambioParametroOperativo): CambioParametroOperativo {
  if (entrada.codigo !== PAYMENT_HOLD_MINUTES.codigo ||
      !Number.isSafeInteger(entrada.valor) ||
      entrada.valor < PAYMENT_HOLD_MINUTES.minimo || entrada.valor > PAYMENT_HOLD_MINUTES.maximo ||
      !Number.isSafeInteger(entrada.expectedVersion) || entrada.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El parámetro operativo es inválido.');
  }
  const motivo = entrada.motivo?.trim();
  if (!motivo || motivo.length < 5 || motivo.length > 500) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El motivo debe tener entre 5 y 500 caracteres.');
  }
  return { ...entrada, motivo };
}

export function normalizarPaymentHoldMinutes(valor: unknown): number {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= PAYMENT_HOLD_MINUTES.minimo &&
    numero <= PAYMENT_HOLD_MINUTES.maximo ? numero : PAYMENT_HOLD_MINUTES.fallback;
}
