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

export type VentanaComida = {
  desde: string;
  hasta: string;
};

export type HorariosComidas = {
  version: number;
  desayuno: VentanaComida;
  almuerzo: VentanaComida;
  cena: VentanaComida;
  actualizadoAt: string;
};

export type ConfiguracionBaseReservas = {
  parametros: ParametroOperativoReserva[];
  horariosComidas: HorariosComidas;
  servicios: ServicioAlojamiento[];
  opcionesPreparacion: OpcionPreparacionEstadia[];
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
      nombreComercial: string;
      descripcionComercial: string;
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
    ajustes: Array<{
      codigo: string;
      nombre: string;
      anticipacionDesdeDias: number;
      anticipacionHastaDias: number | null;
      direccion: 'descuento' | 'recargo';
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
    precioDesayunoCentavos: number;
    precioAlmuerzoCentavos: number;
    precioCenaCentavos: number;
    ajustePaqueteCentavos: number;
    publicadoAt: string;
  }>;
};

export type TipoServicioAlojamiento = 'domo' | 'refugio' | 'camping' | 'bell_tent';
export type DisponibilidadServicioAlojamiento = 'incluido' | 'no_disponible';

export type ServicioAlojamiento = {
  id: number;
  tipoAlojamiento: TipoServicioAlojamiento;
  codigo: string;
  nombre: string;
  disponibilidad: DisponibilidadServicioAlojamiento;
  detalle: string;
  visibleEnReserva: boolean;
  orden: number;
  actualizadoAt: string;
};

export type CambioServicioAlojamiento = Omit<ServicioAlojamiento, 'codigo' | 'actualizadoAt'> & {
  expectedUpdatedAt: string;
  motivo: string;
};

export type NuevoServicioAlojamiento = Omit<ServicioAlojamiento, 'id' | 'actualizadoAt'> & {
  motivo: string;
};

export type OpcionPreparacionEstadia = {
  id: number;
  tipoAlojamiento: TipoServicioAlojamiento;
  modalidad: 'privada' | 'compartida' | 'camping';
  cantidadPersonas: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  habilitada: boolean;
  orden: number;
  actualizadoAt: string;
};

export type CambioOpcionPreparacionEstadia = Omit<OpcionPreparacionEstadia, 'codigo' | 'actualizadoAt'> & {
  expectedUpdatedAt: string;
  motivo: string;
};

export type CambioModalidadComercial = {
  id: number;
  modalidad: 'privada' | 'compartida' | 'camping';
  contexto: 'general' | 'retiro';
  unidadVenta: 'espacio' | 'cama' | 'parcela';
  habilitada: boolean;
  nombreComercial?: string;
  descripcionComercial?: string;
  expectedUpdatedAt: string;
  motivo: string;
};

export type NuevaModalidadComercial = Omit<CambioModalidadComercial, 'id' | 'expectedUpdatedAt'> & {
  espacioCodigo: string;
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
  precioDesayunoCentavos?: number;
  precioAlmuerzoCentavos?: number;
  precioCenaCentavos?: number;
  ajustePaqueteCentavos?: number;
  expectedVersion: number;
  motivo: string;
};

export type CambioHorariosComidas = {
  desayuno: VentanaComida;
  almuerzo: VentanaComida;
  cena: VentanaComida;
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
  nombreComercial: string;
  descripcionComercial: string;
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
  if (entrada.nombreComercial !== undefined && (!entrada.nombreComercial.trim() || entrada.nombreComercial.trim().length > 80)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El nombre comercial de la modalidad es inválido.');
  }
  if (entrada.descripcionComercial !== undefined && entrada.descripcionComercial.trim().length > 300) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La información de la modalidad no puede superar los 300 caracteres.');
  }
  const unidadValida = entrada.modalidad === 'privada'
    ? entrada.unidadVenta === 'espacio'
    : entrada.modalidad === 'camping'
      ? entrada.unidadVenta === 'parcela'
      : ['cama', 'espacio'].includes(entrada.unidadVenta);
  if (!unidadValida) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La unidad de venta no corresponde a la modalidad elegida.');
  }
  return {
    ...entrada,
    descripcionComercial: entrada.descripcionComercial?.trim() || '',
    motivo: validarMotivo(entrada.motivo),
  };
}

export function validarNuevaModalidadComercial(entrada: NuevaModalidadComercial): NuevaModalidadComercial {
  if (!entrada.nombreComercial?.trim()) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El nombre comercial de la modalidad es obligatorio.');
  }
  const validada = validarCambioModalidadComercial({
    ...entrada, id: 1, expectedUpdatedAt: 'nuevo',
  });
  if (!entrada.espacioCodigo?.trim()) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El alojamiento de la modalidad es obligatorio.');
  }
  const { id: _id, expectedUpdatedAt: _expected, ...resultado } = validada;
  return { ...resultado, nombreComercial: entrada.nombreComercial.trim(), espacioCodigo: entrada.espacioCodigo.trim() };
}

function validarDatosServicioAlojamiento<T extends {
  tipoAlojamiento: string;
  nombre: string;
  disponibilidad: string;
  detalle: string;
  visibleEnReserva: boolean;
  orden: number;
  motivo: string;
}>(entrada: T): T {
  if (!['domo', 'refugio', 'camping', 'bell_tent'].includes(entrada.tipoAlojamiento) ||
      !['incluido', 'no_disponible'].includes(entrada.disponibilidad) ||
      typeof entrada.visibleEnReserva !== 'boolean' || !Number.isSafeInteger(entrada.orden) ||
      entrada.orden < 0 || entrada.orden > 999 || !entrada.nombre?.trim() ||
      entrada.nombre.trim().length > 80 || (entrada.detalle || '').trim().length > 240) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El servicio del alojamiento es inválido.');
  }
  return {
    ...entrada,
    nombre: entrada.nombre.trim(),
    detalle: (entrada.detalle || '').trim(),
    motivo: validarMotivo(entrada.motivo),
  };
}

export function validarCambioServicioAlojamiento(entrada: CambioServicioAlojamiento): CambioServicioAlojamiento {
  if (!Number.isSafeInteger(entrada.id) || entrada.id < 1 || !entrada.expectedUpdatedAt) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El servicio del alojamiento es inválido.');
  }
  return validarDatosServicioAlojamiento(entrada);
}

export function validarNuevoServicioAlojamiento(entrada: NuevoServicioAlojamiento): NuevoServicioAlojamiento {
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(entrada.codigo || '')) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El código del servicio es inválido.');
  }
  return validarDatosServicioAlojamiento({ ...entrada, codigo: entrada.codigo.trim() });
}

export function validarCambioOpcionPreparacionEstadia(
  entrada: CambioOpcionPreparacionEstadia
): CambioOpcionPreparacionEstadia {
  if (!Number.isSafeInteger(entrada.id) || entrada.id < 1 ||
      !['domo', 'refugio', 'camping', 'bell_tent'].includes(entrada.tipoAlojamiento) ||
      !['privada', 'compartida', 'camping'].includes(entrada.modalidad) ||
      !Number.isSafeInteger(entrada.cantidadPersonas) || entrada.cantidadPersonas < 1 ||
      entrada.cantidadPersonas > 20 || !entrada.nombre?.trim() || entrada.nombre.trim().length > 80 ||
      (entrada.descripcion || '').trim().length > 240 || typeof entrada.habilitada !== 'boolean' ||
      !Number.isSafeInteger(entrada.orden) || entrada.orden < 0 || entrada.orden > 999 ||
      !entrada.expectedUpdatedAt) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La opción de preparación es inválida.');
  }
  return {
    ...entrada,
    nombre: entrada.nombre.trim(),
    descripcion: (entrada.descripcion || '').trim(),
    motivo: validarMotivo(entrada.motivo),
  };
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
      ![entrada.precioDesayunoCentavos ?? entrada.precioComidaCentavos,
        entrada.precioAlmuerzoCentavos ?? entrada.precioComidaCentavos,
        entrada.precioCenaCentavos ?? entrada.precioComidaCentavos]
        .every(valor => Number.isSafeInteger(valor) && valor >= 0 && valor <= 1_000_000_000) ||
      !Number.isSafeInteger(entrada.ajustePaqueteCentavos ?? 0) ||
      Math.abs(entrada.ajustePaqueteCentavos ?? 0) > 1_000_000_000 ||
      !Number.isSafeInteger(entrada.expectedVersion) || entrada.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La tarifa de alimentación es inválida.');
  }
  return { ...entrada, motivo: validarMotivo(entrada.motivo) };
}

function minutosHora(valor: string): number | null {
  const coincidencia = /^(\d{2}):(\d{2})$/.exec(valor || '');
  if (!coincidencia) return null;
  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) return null;
  return horas * 60 + minutos;
}

export function validarCambioHorariosComidas(entrada: CambioHorariosComidas): CambioHorariosComidas {
  const ventanas = [entrada.desayuno, entrada.almuerzo, entrada.cena];
  const ventanasValidas = ventanas.every(ventana => {
    const desde = minutosHora(ventana?.desde);
    const hasta = minutosHora(ventana?.hasta);
    return desde !== null && hasta !== null && desde < hasta;
  });
  if (!ventanasValidas || !Number.isSafeInteger(entrada.expectedVersion) || entrada.expectedVersion < 1) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Los horarios de comidas son inválidos.');
  }
  return { ...entrada, motivo: validarMotivo(entrada.motivo) };
}

export function normalizarPaymentHoldMinutes(valor: unknown): number {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= PAYMENT_HOLD_MINUTES.minimo &&
    numero <= PAYMENT_HOLD_MINUTES.maximo ? numero : PAYMENT_HOLD_MINUTES.fallback;
}
