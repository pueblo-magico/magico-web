export type TipoEspacio =
  | 'refugio'
  | 'habitacion'
  | 'domo'
  | 'camping'
  | 'salon'
  | 'bell_tent';

export type ModalidadAlojamiento = 'privada' | 'compartida' | 'camping';
export type ContextoAlojamiento = 'general' | 'retiro';
export type UnidadVenta = 'espacio' | 'cama' | 'parcela';

export type EspacioInventario = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoEspacio;
  parentId: number | null;
  capacidadComercial: number;
  capacidadOperativaMaxima: number;
  reservableGeneral: boolean;
  reservableRetiro: boolean;
  estado: 'activo' | 'configuracion_pendiente' | 'inactivo';
};

export type ModalidadEspacio = {
  espacioId: number;
  modalidad: ModalidadAlojamiento;
  contexto: ContextoAlojamiento;
  unidadVenta: UnidadVenta;
  habilitada: boolean;
};

export type UnidadAsignable = {
  id: number;
  espacioId: number;
  codigo: string;
  nombre: string;
  tipo: 'cama_simple' | 'cama_doble' | 'plaza_flexible' | 'parcela' | 'bell_tent';
  capacidad: number;
  estado: 'activa' | 'mantenimiento' | 'inactiva' | 'configuracion_pendiente';
  asignable: boolean;
};

export type DisponibilidadInventario = {
  disponible: boolean;
  capacidadDisponible: number;
  unidadesDisponibles: number[];
};

export function modalidadValidaParaEspacio(
  espacio: EspacioInventario,
  modalidad: ModalidadEspacio
): boolean {
  if (!modalidad.habilitada || espacio.estado !== 'activo' || modalidad.espacioId !== espacio.id) {
    return false;
  }
  if (modalidad.contexto === 'general' && !espacio.reservableGeneral) return false;
  if (modalidad.contexto === 'retiro' && !espacio.reservableRetiro) return false;
  if (espacio.tipo === 'salon') return false;
  if (modalidad.modalidad === 'privada') {
    const espacioPrivadoValido =
      espacio.tipo === 'domo' ||
      espacio.tipo === 'bell_tent' ||
      espacio.codigo === 'refugio-habitacion-4';
    return espacioPrivadoValido && modalidad.unidadVenta === 'espacio';
  }
  if (modalidad.modalidad === 'camping') {
    return (espacio.tipo === 'camping' || espacio.tipo === 'bell_tent') &&
      modalidad.unidadVenta === 'parcela';
  }
  return ['refugio', 'habitacion', 'domo'].includes(espacio.tipo) &&
    (modalidad.unidadVenta === 'cama' || modalidad.unidadVenta === 'espacio');
}

export function calcularDisponibilidadInventario(
  espacio: EspacioInventario,
  modalidad: ModalidadEspacio,
  unidades: UnidadAsignable[],
  unidadesOcupadas: ReadonlySet<number>,
  personas: number
): DisponibilidadInventario {
  if (!Number.isInteger(personas) || personas < 1 || !modalidadValidaParaEspacio(espacio, modalidad)) {
    return { disponible: false, capacidadDisponible: 0, unidadesDisponibles: [] };
  }

  if (modalidad.unidadVenta === 'espacio') {
    const ocupada = unidades.some(unidad => unidadesOcupadas.has(unidad.id));
    const capacidad = ocupada ? 0 : espacio.capacidadComercial;
    return {
      disponible: !ocupada && personas <= capacidad,
      capacidadDisponible: capacidad,
      unidadesDisponibles: [],
    };
  }

  const disponibles = unidades.filter(unidad =>
    unidad.asignable &&
    unidad.estado === 'activa' &&
    !unidadesOcupadas.has(unidad.id)
  );
  const capacidad = disponibles.reduce((total, unidad) => total + unidad.capacidad, 0);
  return {
    disponible: personas <= capacidad,
    capacidadDisponible: capacidad,
    unidadesDisponibles: disponibles.map(unidad => unidad.id),
  };
}
