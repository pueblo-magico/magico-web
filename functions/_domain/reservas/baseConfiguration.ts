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
    modalidades: Array<{
      id: number;
      modalidad: string;
      contexto: string;
      unidadVenta: string;
      habilitada: boolean;
      actualizadoAt: string;
    }>;
  }>;
  tarifa: null | {
    id: number;
    codigo: string;
    nombre: string;
    moneda: string;
    version: number;
    reglasPrecio: number;
    reglasSena: number;
    publicadoAt: string;
    temporadas: Array<{
      codigo: string;
      nombre: string;
      fechaDesde: string;
      fechaHasta: string;
      prioridad: number;
      reglas: Array<{
        tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
        modalidad: 'cualquiera' | 'privada' | 'compartida' | 'camping';
        ocupacionMin: number;
        ocupacionMax: number;
        baseCalculo: 'unidad_noche' | 'persona_noche';
        importeCentavos: number;
        exclusividadDesde: number | null;
        exclusividadHasta: number | null;
      }>;
    }>;
    senas: Array<{
      subtotalDesdeCentavos: number;
      subtotalHastaCentavos: number | null;
      tipo: 'porcentaje_bps' | 'importe_fijo';
      valor: number;
    }>;
  };
  politicaCancelacion: null | {
    codigo: string;
    nombre: string;
    version: number;
    estado: string;
    vigenciaDesde: string | null;
    reglas: Array<{ horasMinimasAntes: number; porcentajeDevolucionBps: number }>;
  };
  alimentacion: Array<{
    id: number;
    codigo: 'desayuno_incluido' | 'pension_completa';
    moneda: string;
    version: number;
    precioComidaCentavos: number;
    comidasAdicionalesPorPersonaNoche: number;
    publicadoAt: string;
  }>;
};

export type CambioModalidadComercial = {
  id: number;
  habilitada: boolean;
  expectedHabilitada: boolean;
  motivo: string;
};

export type CambioTarifaAlimentacion = {
  codigo: 'desayuno_incluido' | 'pension_completa';
  precioComidaCentavos: number;
  expectedVersion: number;
  motivo: string;
};

export type ModalidadComercialActualizada = {
  id: number;
  espacioCodigo: string;
  modalidad: string;
  contexto: string;
  unidadVenta: string;
  habilitada: boolean;
  actualizadoAt: string;
};

export type TarifaAlimentacionActualizada = ConfiguracionBaseReservas['alimentacion'][number];

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

function validarMotivo(motivoEntrada: string): string {
  const motivo = motivoEntrada?.trim();
  if (!motivo || motivo.length < 5 || motivo.length > 500) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El motivo debe tener entre 5 y 500 caracteres.');
  }
  return motivo;
}

export function validarCambioModalidadComercial(entrada: CambioModalidadComercial): CambioModalidadComercial {
  if (!Number.isSafeInteger(entrada.id) || entrada.id < 1 ||
      typeof entrada.habilitada !== 'boolean' || typeof entrada.expectedHabilitada !== 'boolean') {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La modalidad comercial es inválida.');
  }
  return { ...entrada, motivo: validarMotivo(entrada.motivo) };
}

export function validarCambioTarifaAlimentacion(entrada: CambioTarifaAlimentacion): CambioTarifaAlimentacion {
  if (!['desayuno_incluido', 'pension_completa'].includes(entrada.codigo) ||
      !Number.isSafeInteger(entrada.precioComidaCentavos) || entrada.precioComidaCentavos < 0 ||
      entrada.precioComidaCentavos > 1_000_000_000 ||
      !Number.isSafeInteger(entrada.expectedVersion) || entrada.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La tarifa de alimentación es inválida.');
  }
  return { ...entrada, motivo: validarMotivo(entrada.motivo) };
}

export function normalizarPaymentHoldMinutes(valor: unknown): number {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= PAYMENT_HOLD_MINUTES.minimo &&
    numero <= PAYMENT_HOLD_MINUTES.maximo ? numero : PAYMENT_HOLD_MINUTES.fallback;
}
