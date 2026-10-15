export type RegimenAlimentacion = 'desayuno_incluido' | 'pension_completa';

export type ConfiguracionTarifaAlimentacion = {
  codigo: RegimenAlimentacion;
  version: number;
  moneda: string;
  precioComidaCentavos: number;
  comidasAdicionalesPorPersonaNoche: number;
  precioDesayunoCentavos?: number;
  precioAlmuerzoCentavos?: number;
  precioCenaCentavos?: number;
  ajustePaqueteCentavos?: number;
};

export type CotizacionAlimentacion = {
  regimen: RegimenAlimentacion;
  version: number;
  precioComidaCentavos: number;
  comidasAdicionalesPorPersonaNoche: number;
  precioDesayunoCentavos: number;
  precioAlmuerzoCentavos: number;
  precioCenaCentavos: number;
  ajustePaqueteCentavos: number;
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
  const precioDesayunoCentavos = configuracion.precioDesayunoCentavos ??
    (configuracion.codigo === 'desayuno_incluido' ? configuracion.precioComidaCentavos : 0);
  const precioAlmuerzoCentavos = configuracion.precioAlmuerzoCentavos ??
    (configuracion.codigo === 'pension_completa' ? configuracion.precioComidaCentavos : 0);
  const precioCenaCentavos = configuracion.precioCenaCentavos ??
    (configuracion.codigo === 'pension_completa' ? configuracion.precioComidaCentavos : 0);
  const ajustePaqueteCentavos = configuracion.ajustePaqueteCentavos ?? 0;
  const adicionalPorPersonaNoche = configuracion.codigo === 'pension_completa'
    ? Math.max(0, precioAlmuerzoCentavos + precioCenaCentavos + ajustePaqueteCentavos)
    : 0;
  return {
    regimen: configuracion.codigo,
    version: configuracion.version,
    precioComidaCentavos: configuracion.precioComidaCentavos,
    comidasAdicionalesPorPersonaNoche: configuracion.comidasAdicionalesPorPersonaNoche,
    precioDesayunoCentavos,
    precioAlmuerzoCentavos,
    precioCenaCentavos,
    ajustePaqueteCentavos,
    totalCentavos: personas * noches * adicionalPorPersonaNoche,
  };
}
