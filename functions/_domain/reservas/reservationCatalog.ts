import { ErrorReserva } from './errors.ts';

export const ESTADOS_RESERVA = [
  'pendiente_pago', 'confirmada', 'cancelada', 'vencida', 'rechazada',
] as const;
export type EstadoReservaCanonico = typeof ESTADOS_RESERVA[number];

export const TIPOS_ESTADIA = ['huesped', 'staff', 'voluntario', 'residente'] as const;
export type TipoEstadiaCanonico = typeof TIPOS_ESTADIA[number];

const ESTADO_LEGACY: Record<string, EstadoReservaCanonico> = {
  pendiente: 'pendiente_pago',
  pendiente_pago: 'pendiente_pago',
  confirmada: 'confirmada',
  cancelada: 'cancelada',
  vencida: 'vencida',
  rechazada: 'rechazada',
};

export function normalizarEstadoReserva(valor: unknown): EstadoReservaCanonico {
  const normalizado = typeof valor === 'string' ? ESTADO_LEGACY[valor.trim().toLowerCase()] : undefined;
  if (!normalizado) throw new ErrorReserva('DATOS_INVALIDOS', 'El estado es inválido.');
  return normalizado;
}

export function normalizarTipoEstadia(valor: unknown): TipoEstadiaCanonico {
  const normalizado = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (!TIPOS_ESTADIA.includes(normalizado as TipoEstadiaCanonico)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El tipo de estadía es inválido.');
  }
  return normalizado as TipoEstadiaCanonico;
}

export const ETIQUETAS_ESTADO_RESERVA: Record<EstadoReservaCanonico, string> = {
  pendiente_pago: 'Pendiente de pago',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  rechazada: 'Rechazada',
};
