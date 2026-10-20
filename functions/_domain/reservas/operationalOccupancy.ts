import { ErrorReserva } from './errors.ts';
import { esFechaIso, nochesEntre } from './dateRange.ts';

export type TipoBloqueoInventario = 'mantenimiento' | 'cierre' | 'uso_interno' | 'bloqueo_propietario';
export type TipoEstadiaNoComercial = 'staff' | 'voluntario' | 'residente';

export type ObjetivoInventario = {
  espacioId: number | null;
  unidadInventarioId: number | null;
};

export type NuevoBloqueoInventario = ObjetivoInventario & {
  fechaDesde: string;
  fechaHasta: string;
  tipo: TipoBloqueoInventario;
  motivo: string;
};

export type NuevaEstadiaNoComercial = ObjetivoInventario & {
  fechaCheckin: string;
  fechaCheckout: string;
  tipo: TipoEstadiaNoComercial;
  referenciaOperativa: string;
  cantidadPersonas: number;
};

export type RegistroOcupacionOperativa = {
  id: number;
  codigo: string;
  clase: 'bloqueo' | 'estadia_no_comercial';
  tipo: TipoBloqueoInventario | TipoEstadiaNoComercial;
  estado: 'activo' | 'cancelado' | 'activa' | 'cancelada';
  espacioId: number | null;
  unidadInventarioId: number | null;
  fechaDesde: string;
  fechaHasta: string;
  detalle: string;
  cantidadPersonas: number;
  creadoPor: string;
  createdAt: string;
};

export type ObjetivosOcupacionOperativa = {
  espacios: Array<{
    id: number;
    codigo: string;
    nombre: string;
    tipo: string;
    parentId: number | null;
    capacidadOperativaMaxima: number;
    estado: string;
  }>;
  unidades: Array<{
    id: number;
    espacioId: number;
    codigo: string;
    nombre: string;
    tipo: string;
    capacidad: number;
    estado: string;
  }>;
};

const TIPOS_BLOQUEO = new Set<TipoBloqueoInventario>([
  'mantenimiento', 'cierre', 'uso_interno', 'bloqueo_propietario',
]);
const TIPOS_ESTADIA = new Set<TipoEstadiaNoComercial>(['staff', 'voluntario', 'residente']);

function validarObjetivo(objetivo: ObjetivoInventario): void {
  const espacioValido = Number.isSafeInteger(objetivo.espacioId) && Number(objetivo.espacioId) > 0;
  const unidadValida = Number.isSafeInteger(objetivo.unidadInventarioId) && Number(objetivo.unidadInventarioId) > 0;
  if (espacioValido === unidadValida) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Debe indicar exactamente un espacio o una unidad de inventario.');
  }
}

function validarRango(desde: string, hasta: string): void {
  if (!esFechaIso(desde) || !esFechaIso(hasta) || nochesEntre(desde, hasta) === null) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El rango de noches es inválido.');
  }
}

export function validarNuevoBloqueo(entrada: NuevoBloqueoInventario): NuevoBloqueoInventario {
  validarObjetivo(entrada);
  validarRango(entrada.fechaDesde, entrada.fechaHasta);
  if (!TIPOS_BLOQUEO.has(entrada.tipo) || entrada.motivo.trim().length < 3) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El tipo o motivo del bloqueo es inválido.');
  }
  return { ...entrada, motivo: entrada.motivo.trim() };
}

export function validarNuevaEstadiaNoComercial(
  entrada: NuevaEstadiaNoComercial
): NuevaEstadiaNoComercial {
  validarObjetivo(entrada);
  validarRango(entrada.fechaCheckin, entrada.fechaCheckout);
  if (!TIPOS_ESTADIA.has(entrada.tipo) || entrada.referenciaOperativa.trim().length < 3 ||
      !Number.isSafeInteger(entrada.cantidadPersonas) || entrada.cantidadPersonas < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Los datos de la estadía no comercial son inválidos.');
  }
  return { ...entrada, referenciaOperativa: entrada.referenciaOperativa.trim() };
}
