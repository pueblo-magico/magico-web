export type EstadoPagoReserva =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'devuelto'
  | 'importado_legacy';

const TRANSICIONES: Record<EstadoPagoReserva, readonly EstadoPagoReserva[]> = {
  pendiente: ['pendiente', 'aprobado', 'rechazado'],
  aprobado: ['aprobado', 'devuelto'],
  rechazado: ['rechazado'],
  devuelto: ['devuelto'],
  importado_legacy: ['importado_legacy', 'pendiente', 'aprobado', 'rechazado', 'devuelto'],
};

export function transicionPagoValida(
  estadoActual: EstadoPagoReserva,
  estadoNuevo: EstadoPagoReserva
): boolean {
  return TRANSICIONES[estadoActual].includes(estadoNuevo);
}
