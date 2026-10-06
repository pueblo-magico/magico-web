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
  clienteTelefono: string | null;
  clienteEmail: string | null;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  estado: string;
  estadoFlujo: string;
  canalOrigen: string | null;
  alojamientoId: number;
  alojamientoTipo: string;
  espacioCodigo: string | null;
  espacioNombre: string | null;
  modalidad: string;
  montoTotalCentavos: number;
  montoSenaCentavos: number | null;
  unidadAsignada: string | null;
  manychatUserId: string | null;
  createdAt: string;
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
  moneda: string;
  estadias: Array<Record<string, unknown>>;
  excepciones: Array<Record<string, unknown>>;
};

export type NuevaReservaAdmin = {
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadPersonas: number;
  espacioCodigo: string;
  modalidad: 'privada' | 'compartida' | 'camping';
  canalOrigen: string;
  montoTotalCentavos: number;
  montoSenaCentavos: number | null;
};

export type CambiosReservaAdmin = Partial<Pick<
  NuevaReservaAdmin,
  'clienteNombre' | 'clienteTelefono' | 'clienteEmail' | 'canalOrigen'
>>;

export type AccionEstadoReservaAdmin = 'confirmar' | 'cancelar' | 'vencer';

function textoRequerido(valor: unknown, etiqueta: string, maximo = 160): string {
  if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > maximo) {
    throw new ErrorReserva('DATOS_INVALIDOS', `${etiqueta} es inválido.`);
  }
  return valor.trim();
}

export function validarNuevaReservaAdmin(entrada: NuevaReservaAdmin): NuevaReservaAdmin {
  const fechaCheckin = entrada.fechaCheckin?.trim();
  const fechaCheckout = entrada.fechaCheckout?.trim();
  if (!esFechaIso(fechaCheckin) || !esFechaIso(fechaCheckout) || fechaCheckout <= fechaCheckin) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Las fechas de la reserva son inválidas.');
  }
  if (!Number.isSafeInteger(entrada.cantidadPersonas) || entrada.cantidadPersonas < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La cantidad de personas es inválida.');
  }
  if (!Number.isSafeInteger(entrada.montoTotalCentavos) || entrada.montoTotalCentavos < 0 ||
      (entrada.montoSenaCentavos !== null &&
       (!Number.isSafeInteger(entrada.montoSenaCentavos) || entrada.montoSenaCentavos < 0 ||
        entrada.montoSenaCentavos > entrada.montoTotalCentavos))) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Los importes son inválidos.');
  }
  if (!['privada', 'compartida', 'camping'].includes(entrada.modalidad)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La modalidad es inválida.');
  }
  return {
    ...entrada,
    clienteNombre: textoRequerido(entrada.clienteNombre, 'El titular'),
    clienteTelefono: entrada.clienteTelefono?.trim() || null,
    clienteEmail: entrada.clienteEmail?.trim().toLowerCase() || null,
    fechaCheckin, fechaCheckout,
    espacioCodigo: textoRequerido(entrada.espacioCodigo, 'El espacio', 80),
    canalOrigen: textoRequerido(entrada.canalOrigen, 'El origen', 80),
  };
}

export function validarCambiosReservaAdmin(entrada: CambiosReservaAdmin): CambiosReservaAdmin {
  const campos = Object.keys(entrada);
  if (campos.length === 0 || campos.some(campo =>
    !['clienteNombre', 'clienteTelefono', 'clienteEmail', 'canalOrigen'].includes(campo)
  )) throw new ErrorReserva('DATOS_INVALIDOS', 'No hay campos editables válidos.');
  return {
    ...(entrada.clienteNombre !== undefined
      ? { clienteNombre: textoRequerido(entrada.clienteNombre, 'El titular') } : {}),
    ...(entrada.clienteTelefono !== undefined
      ? { clienteTelefono: entrada.clienteTelefono?.trim() || null } : {}),
    ...(entrada.clienteEmail !== undefined
      ? { clienteEmail: entrada.clienteEmail?.trim().toLowerCase() || null } : {}),
    ...(entrada.canalOrigen !== undefined
      ? { canalOrigen: textoRequerido(entrada.canalOrigen, 'El origen', 80) } : {}),
  };
}

export function validarMotivoCambioSensible(motivo: unknown): string {
  if (typeof motivo !== 'string' || motivo.trim().length < 5 || motivo.trim().length > 500) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El motivo debe tener entre 5 y 500 caracteres.');
  }
  return motivo.trim();
}
