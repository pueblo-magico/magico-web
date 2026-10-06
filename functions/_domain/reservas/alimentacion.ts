export type RegimenAlimentacion = 'desayuno_incluido' | 'pension_completa';

export type ConfiguracionTarifaAlimentacion = {
  codigo: RegimenAlimentacion;
  version: number;
  moneda: string;
  precioComidaCentavos: number;
  comidasAdicionalesPorPersonaNoche: number;
};

export type CotizacionAlimentacion = {
  regimen: RegimenAlimentacion;
  version: number;
  precioComidaCentavos: number;
  comidasAdicionalesPorPersonaNoche: number;
  totalCentavos: number;
};

export function esRegimenAlimentacion(valor: unknown): valor is RegimenAlimentacion {
  return valor === 'desayuno_incluido' || valor === 'pension_completa';
}

export function cotizarAlimentacion(
  personas: number,
  noches: number,
  configuracion: ConfiguracionTarifaAlimentacion
): CotizacionAlimentacion {
  return {
    regimen: configuracion.codigo,
    version: configuracion.version,
    precioComidaCentavos: configuracion.precioComidaCentavos,
    comidasAdicionalesPorPersonaNoche: configuracion.comidasAdicionalesPorPersonaNoche,
    totalCentavos: personas * noches * configuracion.comidasAdicionalesPorPersonaNoche *
      configuracion.precioComidaCentavos,
  };
}
