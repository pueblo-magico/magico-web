import type { FiltrosReservasAdmin } from './adminReservationManagement.ts';
import { ErrorReserva } from './errors.ts';

export type FiltrosExportacionReservas = Omit<FiltrosReservasAdmin, 'pagina' | 'limite'> & {
  incluirPii: boolean;
};

export type FilaExportacionReserva = {
  codigo: string;
  titular: string | null;
  telefono: string | null;
  email: string | null;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  estado: string;
  tipoEstadia: string;
  canalOrigen: string | null;
  espacioCodigo: string | null;
  espacioNombre: string | null;
  modalidad: string;
  moneda: string;
  montoTotalCentavos: number;
  montoSenaCentavos: number | null;
};

export type ExportacionReservas = {
  csv: string;
  cantidad: number;
  truncada: boolean;
  incluyePii: boolean;
};

export function leerBooleanoExportacion(valor: string | null): boolean {
  if (valor == null || valor === '' || valor === 'false' || valor === '0') return false;
  if (valor === 'true' || valor === '1') return true;
  throw new ErrorReserva('DATOS_INVALIDOS', 'El indicador incluir_pii es inválido.');
}

function csvSeguro(valor: unknown): string {
  let texto = valor == null ? '' : String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function serializarExportacionReservas(
  filas: FilaExportacionReserva[],
  incluirPii: boolean
): string {
  const columnas = [
    'codigo', ...(incluirPii ? ['titular', 'telefono', 'email'] : []),
    'fecha_checkin', 'fecha_checkout', 'cantidad_personas', 'estado', 'tipo_estadia',
    'canal_origen', 'espacio_codigo', 'espacio_nombre', 'modalidad', 'moneda',
    'monto_total_centavos', 'monto_sena_centavos', 'saldo_centavos',
  ];
  const datos = filas.map(fila => {
    const valores: Record<string, unknown> = {
      ...fila,
      fecha_checkin: fila.fechaCheckin,
      fecha_checkout: fila.fechaCheckout,
      cantidad_personas: fila.cantidadPersonas,
      tipo_estadia: fila.tipoEstadia,
      canal_origen: fila.canalOrigen,
      espacio_codigo: fila.espacioCodigo,
      espacio_nombre: fila.espacioNombre,
      monto_total_centavos: fila.montoTotalCentavos,
      monto_sena_centavos: fila.montoSenaCentavos,
      saldo_centavos: fila.montoTotalCentavos - (fila.montoSenaCentavos || 0),
    };
    return columnas.map(columna => csvSeguro(valores[columna])).join(',');
  });
  return `\uFEFF${[columnas.join(','), ...datos].join('\r\n')}\r\n`;
}
