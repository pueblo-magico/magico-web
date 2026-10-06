import { esFechaIso } from './dateRange.ts';
import { ErrorReserva } from './errors.ts';

export type FiltrosReservasAdmin = {
  pagina: number;
  limite: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  estado: string | null;
  origen: string | null;
  espacioCodigo: string | null;
  titular: string | null;
};

export function validarFiltrosReservasAdmin(
  entrada: Partial<FiltrosReservasAdmin>
): FiltrosReservasAdmin {
  const pagina = Number(entrada.pagina ?? 1);
  const limite = Number(entrada.limite ?? 25);
  if (!Number.isSafeInteger(pagina) || pagina < 1 ||
      !Number.isSafeInteger(limite) || limite < 1 || limite > 100) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La paginación es inválida.');
  }
  const fechaDesde = entrada.fechaDesde?.trim() || null;
  const fechaHasta = entrada.fechaHasta?.trim() || null;
  if ((fechaDesde && !esFechaIso(fechaDesde)) || (fechaHasta && !esFechaIso(fechaHasta)) ||
      (fechaDesde && fechaHasta && fechaHasta <= fechaDesde)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El rango de fechas es inválido.');
  }
  const estado = entrada.estado?.trim() || null;
  if (estado && !['pendiente_pago', 'confirmada', 'cancelada', 'vencida', 'rechazada'].includes(estado)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El estado es inválido.');
  }
  const normalizar = (valor: string | null | undefined, maximo: number) => {
    const limpio = valor?.trim() || null;
    if (limpio && limpio.length > maximo) throw new ErrorReserva('DATOS_INVALIDOS', 'Un filtro es demasiado largo.');
    return limpio;
  };
  return {
    pagina, limite, fechaDesde, fechaHasta, estado,
    origen: normalizar(entrada.origen, 80),
    espacioCodigo: normalizar(entrada.espacioCodigo, 80),
    titular: normalizar(entrada.titular, 120),
  };
}

export type ResumenReservaAdmin = {
  id: number;
  codigo: string;
  version: number;
  titular: string;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  estado: string;
  estadoFlujo: string;
  canalOrigen: string | null;
  espacioCodigo: string | null;
  espacioNombre: string | null;
  modalidad: string;
  updatedAt: string;
};

export type PaginaReservasAdmin = {
  items: ResumenReservaAdmin[];
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

export type DetalleReservaAdmin = ResumenReservaAdmin & {
  clienteTelefono: string | null;
  clienteEmail: string | null;
  moneda: string;
  montoTotalCentavos: number;
  montoSenaCentavos: number | null;
  estadias: Array<Record<string, unknown>>;
  excepciones: Array<Record<string, unknown>>;
};
