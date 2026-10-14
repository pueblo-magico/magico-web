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
    reservableGeneral: boolean;
    reservableRetiro: boolean;
    estado: string;
    actualizadoAt: string;
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
      diasSemana: number[];
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
  modalidad: 'privada' | 'compartida' | 'camping';
  contexto: 'general' | 'retiro';
  unidadVenta: 'espacio' | 'cama' | 'parcela';
  habilitada: boolean;
  expectedUpdatedAt: string;
  motivo: string;
};

export type CambioEspacioComercial = {
  codigo: string;
  capacidadComercial: number;
  capacidadOperativaMaxima: number;
  reservableGeneral: boolean;
  reservableRetiro: boolean;
  estado: 'activo' | 'configuracion_pendiente' | 'inactivo';
  expectedUpdatedAt: string;
  motivo: string;
};

export type EspacioComercialActualizado = {
  codigo: string;
  nombre: string;
  tipo: string;
  capacidadComercial: number;
  capacidadOperativaMaxima: number;
  reservableGeneral: boolean;
  reservableRetiro: boolean;
  estado: string;
  actualizadoAt: string;
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
      !['privada', 'compartida', 'camping'].includes(entrada.modalidad) ||
      !['general', 'retiro'].includes(entrada.contexto) ||
      !['espacio', 'cama', 'parcela'].includes(entrada.unidadVenta) ||
      typeof entrada.habilitada !== 'boolean' || !entrada.expectedUpdatedAt) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La modalidad comercial es inválida.');
  }
  const unidadValida = entrada.modalidad === 'privada'
    ? entrada.unidadVenta === 'espacio'
    : entrada.modalidad === 'camping'
      ? entrada.unidadVenta === 'parcela'
      : ['cama', 'espacio'].includes(entrada.unidadVenta);
  if (!unidadValida) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La unidad de venta no corresponde a la modalidad elegida.');
  }
  return { ...entrada, motivo: validarMotivo(entrada.motivo) };
}

export function validarCambioEspacioComercial(entrada: CambioEspacioComercial): CambioEspacioComercial {
  if (!entrada.codigo?.trim() || !Number.isSafeInteger(entrada.capacidadComercial) ||
      !Number.isSafeInteger(entrada.capacidadOperativaMaxima) || entrada.capacidadComercial < 0 ||
      entrada.capacidadOperativaMaxima < entrada.capacidadComercial ||
      typeof entrada.reservableGeneral !== 'boolean' || typeof entrada.reservableRetiro !== 'boolean' ||
      !['activo', 'configuracion_pendiente', 'inactivo'].includes(entrada.estado) || !entrada.expectedUpdatedAt) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Las condiciones comerciales del alojamiento son inválidas.');
  }
  if (entrada.estado === 'activo' && entrada.capacidadComercial < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Un alojamiento activo debe tener capacidad comercial mayor a cero.');
  }
  return { ...entrada, codigo: entrada.codigo.trim(), motivo: validarMotivo(entrada.motivo) };
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
