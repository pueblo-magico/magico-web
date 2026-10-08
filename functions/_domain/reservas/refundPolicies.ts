export type ReglaDevolucion = {
  horasMinimasAntes: number;
  porcentajeDevolucionBps: number;
};

export type SnapshotPoliticaCancelacion = {
  codigo: string;
  version: number;
  estadoConfiguracion: 'pendiente_configuracion' | 'configurada';
  reglas: ReglaDevolucion[];
};

export type BorradorPoliticaCancelacion = {
  codigo: string;
  nombre: string;
  vigenciaDesde: string;
  reglas: ReglaDevolucion[];
};

export type ResultadoCalculoDevolucion =
  | { ok: false; codigo: 'CONFIGURACION_PENDIENTE' | 'POLITICA_INVALIDA' | 'REGLA_NO_DEFINIDA' }
  | {
      ok: true;
      montoCentavos: number;
      porcentajeDevolucionBps: number;
      clasificacion: 'total' | 'parcial' | 'no_reembolsable';
      politicaCodigo: string;
      politicaVersion: number;
    };

export function reglasPoliticaValidas(reglas: ReglaDevolucion[]): boolean {
  if (reglas.length === 0) return false;
  const umbrales = new Set<number>();
  return reglas.every(regla => {
    if (!Number.isInteger(regla.horasMinimasAntes) || regla.horasMinimasAntes < 0 ||
        !Number.isInteger(regla.porcentajeDevolucionBps) ||
        regla.porcentajeDevolucionBps < 0 || regla.porcentajeDevolucionBps > 10_000 ||
        umbrales.has(regla.horasMinimasAntes)) return false;
    umbrales.add(regla.horasMinimasAntes);
    return true;
  });
}

function politicaValida(snapshot: SnapshotPoliticaCancelacion): boolean {
  if (!snapshot.codigo.trim() || !Number.isInteger(snapshot.version) || snapshot.version < 1) return false;
  return reglasPoliticaValidas(snapshot.reglas);
}

export function calcularDevolucion(entrada: {
  snapshot: SnapshotPoliticaCancelacion;
  montoPagadoCentavos: number;
  canceladaAt: string;
  inicioEstadiaAt: string;
}): ResultadoCalculoDevolucion {
  const { snapshot } = entrada;
  if (snapshot.estadoConfiguracion === 'pendiente_configuracion') {
    return { ok: false, codigo: 'CONFIGURACION_PENDIENTE' };
  }
  if (!Number.isInteger(entrada.montoPagadoCentavos) || entrada.montoPagadoCentavos < 0 ||
      !politicaValida(snapshot)) {
    return { ok: false, codigo: 'POLITICA_INVALIDA' };
  }

  const canceladaMs = Date.parse(entrada.canceladaAt);
  const inicioMs = Date.parse(entrada.inicioEstadiaAt);
  if (!Number.isFinite(canceladaMs) || !Number.isFinite(inicioMs)) {
    return { ok: false, codigo: 'POLITICA_INVALIDA' };
  }
  const horasAntes = (inicioMs - canceladaMs) / 3_600_000;
  const regla = snapshot.reglas
    .filter(candidata => candidata.horasMinimasAntes <= horasAntes)
    .sort((a, b) => b.horasMinimasAntes - a.horasMinimasAntes)[0];
  if (!regla) return { ok: false, codigo: 'REGLA_NO_DEFINIDA' };

  const montoCentavos = Math.floor(
    entrada.montoPagadoCentavos * regla.porcentajeDevolucionBps / 10_000
  );
  const clasificacion = montoCentavos === 0
    ? 'no_reembolsable'
    : montoCentavos === entrada.montoPagadoCentavos ? 'total' : 'parcial';
  return {
    ok: true,
    montoCentavos,
    porcentajeDevolucionBps: regla.porcentajeDevolucionBps,
    clasificacion,
    politicaCodigo: snapshot.codigo,
    politicaVersion: snapshot.version,
  };
}
