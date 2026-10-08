import type { SolicitudCotizacion } from './models.ts';

export type ReglaPrecioVersionada = {
  temporadaCodigo: string;
  fechaDesde: string;
  fechaHasta: string;
  prioridad: number;
  tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
  modalidad: 'cualquiera' | 'privada' | 'compartida' | 'camping';
  ocupacionMin: number;
  ocupacionMax: number;
  baseCalculo: 'unidad_noche' | 'persona_noche';
  importeCentavos: number;
  exclusividadDesde: number | null;
  exclusividadHasta: number | null;
};

export type ReglaSenaVersionada = {
  subtotalDesdeCentavos: number;
  subtotalHastaCentavos: number | null;
  tipo: 'porcentaje_bps' | 'importe_fijo';
  valor: number;
};

export type ConfiguracionTarifa = {
  planId: number;
  codigo: string;
  version: number;
  moneda: string;
  reglasPrecio: ReglaPrecioVersionada[];
  reglasSena: ReglaSenaVersionada[];
};

export type CotizacionVersionada = {
  plan: { id: number; codigo: string; version: number };
  moneda: string;
  subtotalCentavos: number;
  senaCentavos: number;
  saldoCentavos: number;
  exclusividadGratis: boolean;
  noches: Array<{
    fecha: string;
    temporada: string;
    importeCentavos: number;
  }>;
};

export type ErrorTarifa = 'TARIFA_NO_CONFIGURADA' | 'TARIFA_AMBIGUA' | 'SENA_NO_CONFIGURADA';

function fechasNocturnas(desde: string, hasta: string): string[] {
  const fechas: string[] = [];
  const cursor = new Date(`${desde}T00:00:00Z`);
  const limite = new Date(`${hasta}T00:00:00Z`);
  while (cursor < limite) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return fechas;
}

export function cotizarConPlan(
  solicitud: SolicitudCotizacion,
  configuracion: ConfiguracionTarifa,
  subtotalAdicionalCentavos = 0
): CotizacionVersionada | { error: ErrorTarifa } {
  const noches = [] as CotizacionVersionada['noches'];
  let exclusividadGratis = false;

  for (const fecha of fechasNocturnas(solicitud.fechaEntrada, solicitud.fechaSalida)) {
    const candidatas = configuracion.reglasPrecio
      .filter(regla =>
        regla.tipoAlojamiento === solicitud.tipo &&
        (regla.modalidad === 'cualquiera' || regla.modalidad === solicitud.modalidad) &&
        solicitud.personas >= regla.ocupacionMin &&
        solicitud.personas <= regla.ocupacionMax &&
        fecha >= regla.fechaDesde && fecha <= regla.fechaHasta
      )
      .sort((a, b) => b.prioridad - a.prioridad);
    if (candidatas.length === 0) return { error: 'TARIFA_NO_CONFIGURADA' };
    if (candidatas.length > 1 && candidatas[0].prioridad === candidatas[1].prioridad) {
      return { error: 'TARIFA_AMBIGUA' };
    }

    const regla = candidatas[0];
    const importeCentavos = regla.importeCentavos *
      (regla.baseCalculo === 'persona_noche' ? solicitud.personas : 1);
    noches.push({ fecha, temporada: regla.temporadaCodigo, importeCentavos });
    exclusividadGratis ||= regla.exclusividadDesde !== null &&
      solicitud.personas >= regla.exclusividadDesde &&
      solicitud.personas <= (regla.exclusividadHasta ?? Number.MAX_SAFE_INTEGER);
  }

  const subtotalCentavos = noches.reduce((total, noche) => total + noche.importeCentavos, 0) +
    subtotalAdicionalCentavos;
  const reglasSena = configuracion.reglasSena.filter(regla =>
    subtotalCentavos >= regla.subtotalDesdeCentavos &&
    (regla.subtotalHastaCentavos === null || subtotalCentavos <= regla.subtotalHastaCentavos)
  );
  if (reglasSena.length !== 1) return { error: 'SENA_NO_CONFIGURADA' };
  const reglaSena = reglasSena[0];
  const senaCentavos = reglaSena.tipo === 'porcentaje_bps'
    ? Math.round(subtotalCentavos * reglaSena.valor / 10_000)
    : reglaSena.valor;

  return {
    plan: { id: configuracion.planId, codigo: configuracion.codigo, version: configuracion.version },
    moneda: configuracion.moneda,
    subtotalCentavos,
    senaCentavos,
    saldoCentavos: subtotalCentavos - senaCentavos,
    exclusividadGratis,
    noches,
  };
}
