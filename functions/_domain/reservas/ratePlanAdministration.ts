import { ErrorReserva } from './errors.ts';
import { esFechaIso } from './dateRange.ts';

export type ReglaPrecioBorrador = {
  tipoAlojamiento: 'domo' | 'refugio' | 'camping' | 'bell_tent';
  modalidad: 'cualquiera' | 'privada' | 'compartida' | 'camping';
  ocupacionMin: number;
  ocupacionMax: number;
  baseCalculo: 'unidad_noche' | 'persona_noche';
  importeCentavos: number;
  exclusividadDesde?: number | null;
  exclusividadHasta?: number | null;
};

export type TemporadaBorrador = {
  codigo: string;
  nombre: string;
  fechaDesde: string;
  fechaHasta: string;
  prioridad: number;
  reglas: ReglaPrecioBorrador[];
};

export type ReglaSenaBorrador = {
  subtotalDesdeCentavos: number;
  subtotalHastaCentavos: number | null;
  tipo: 'porcentaje_bps' | 'importe_fijo';
  valor: number;
};

export type PlanTarifaBorrador = {
  codigo: string;
  nombre: string;
  moneda: string;
  temporadas: TemporadaBorrador[];
  senas: ReglaSenaBorrador[];
};

const CODIGO = /^[a-z0-9][a-z0-9-]{1,49}$/;
const TIPOS_ALOJAMIENTO = new Set(['domo', 'refugio', 'camping', 'bell_tent']);
const MODALIDADES = new Set(['cualquiera', 'privada', 'compartida', 'camping']);
const BASES_CALCULO = new Set(['unidad_noche', 'persona_noche']);
const TIPOS_SENA = new Set(['porcentaje_bps', 'importe_fijo']);

function enteroNoNegativo(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function validarPlanTarifaBorrador(plan: PlanTarifaBorrador): void {
  if (!CODIGO.test(plan.codigo) || !plan.nombre?.trim() || !/^[A-Z]{3}$/.test(plan.moneda)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Código, nombre o moneda del plan inválidos.');
  }
  if (!Array.isArray(plan.temporadas) || plan.temporadas.length === 0 || !Array.isArray(plan.senas) || plan.senas.length === 0) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'El plan requiere temporadas y reglas de seña.');
  }

  const codigos = new Set<string>();
  for (const temporada of plan.temporadas) {
    if (!CODIGO.test(temporada.codigo) || codigos.has(temporada.codigo) ||
        !temporada.nombre?.trim() || !esFechaIso(temporada.fechaDesde) || !esFechaIso(temporada.fechaHasta) ||
        temporada.fechaHasta < temporada.fechaDesde ||
        !Number.isSafeInteger(temporada.prioridad) || temporada.reglas.length === 0) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'La configuración de temporadas es inválida.');
    }
    codigos.add(temporada.codigo);
    for (const regla of temporada.reglas) {
      const exclusividadCompleta = (regla.exclusividadDesde == null) === (regla.exclusividadHasta == null);
      const exclusividadValida = regla.exclusividadDesde == null || (
        Number.isSafeInteger(regla.exclusividadDesde) && regla.exclusividadDesde > 0 &&
        Number.isSafeInteger(regla.exclusividadHasta) && regla.exclusividadHasta! >= regla.exclusividadDesde
      );
      if (!TIPOS_ALOJAMIENTO.has(regla.tipoAlojamiento) || !MODALIDADES.has(regla.modalidad) ||
          !BASES_CALCULO.has(regla.baseCalculo) || !exclusividadCompleta || !exclusividadValida ||
          !Number.isSafeInteger(regla.ocupacionMin) || regla.ocupacionMin < 1 ||
          !Number.isSafeInteger(regla.ocupacionMax) || regla.ocupacionMax < regla.ocupacionMin ||
          !enteroNoNegativo(regla.importeCentavos)) {
        throw new ErrorReserva('DATOS_INVALIDOS', 'La regla de precio contiene importes u ocupación inválidos.');
      }
    }
    for (let i = 0; i < temporada.reglas.length; i++) {
      for (let j = i + 1; j < temporada.reglas.length; j++) {
        const a = temporada.reglas[i];
        const b = temporada.reglas[j];
        if (a.tipoAlojamiento === b.tipoAlojamiento && a.modalidad === b.modalidad &&
            a.ocupacionMin <= b.ocupacionMax && b.ocupacionMin <= a.ocupacionMax) {
          throw new ErrorReserva('DATOS_INVALIDOS', 'Existen reglas de precio ambiguas para la misma temporada.');
        }
      }
    }
  }

  for (let i = 0; i < plan.temporadas.length; i++) {
    for (let j = i + 1; j < plan.temporadas.length; j++) {
      const a = plan.temporadas[i];
      const b = plan.temporadas[j];
      if (a.prioridad !== b.prioridad || a.fechaDesde > b.fechaHasta || b.fechaDesde > a.fechaHasta) continue;
      const ambiguas = a.reglas.some(reglaA => b.reglas.some(reglaB =>
        reglaA.tipoAlojamiento === reglaB.tipoAlojamiento && reglaA.modalidad === reglaB.modalidad &&
        reglaA.ocupacionMin <= reglaB.ocupacionMax && reglaB.ocupacionMin <= reglaA.ocupacionMax
      ));
      if (ambiguas) throw new ErrorReserva('DATOS_INVALIDOS', 'Existen temporadas ambiguas con la misma prioridad.');
    }
  }

  const ordenadas = [...plan.senas].sort((a, b) => a.subtotalDesdeCentavos - b.subtotalDesdeCentavos);
  for (let i = 0; i < ordenadas.length; i++) {
    const regla = ordenadas[i];
    if (!TIPOS_SENA.has(regla.tipo) || !enteroNoNegativo(regla.subtotalDesdeCentavos) ||
        (regla.subtotalHastaCentavos !== null && (!enteroNoNegativo(regla.subtotalHastaCentavos) || regla.subtotalHastaCentavos < regla.subtotalDesdeCentavos)) ||
        !enteroNoNegativo(regla.valor) || (regla.tipo === 'porcentaje_bps' && regla.valor > 10_000)) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'La regla de seña es inválida.');
    }
    if (i > 0) {
      const anterior = ordenadas[i - 1];
      if (anterior.subtotalHastaCentavos === null || anterior.subtotalHastaCentavos >= regla.subtotalDesdeCentavos) {
        throw new ErrorReserva('DATOS_INVALIDOS', 'Las reglas de seña se superponen.');
      }
    }
  }
  if (ordenadas[0].subtotalDesdeCentavos !== 0 || ordenadas.at(-1)?.subtotalHastaCentavos !== null) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'Las reglas de seña deben cubrir desde cero sin límite superior.');
  }
  for (let i = 1; i < ordenadas.length; i++) {
    if (ordenadas[i - 1].subtotalHastaCentavos! + 1 !== ordenadas[i].subtotalDesdeCentavos) {
      throw new ErrorReserva('DATOS_INVALIDOS', 'Las reglas de seña deben cubrir el rango sin huecos.');
    }
  }
}
