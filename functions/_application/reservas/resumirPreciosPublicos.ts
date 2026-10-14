import type { RepositorioInventarioAlojamiento, RepositorioTarifas, RepositorioTarifasAlimentacion } from './ports.ts';
import { listarAlojamientosPublicos } from './listarAlojamientosPublicos.ts';

const TIPOS_PUBLICOS = ['domo', 'refugio', 'camping'] as const;

function diaSemanaIso(fecha: string): number {
  const diaUtc = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return diaUtc === 0 ? 7 : diaUtc;
}

function esTipoPublico(valor: string): valor is typeof TIPOS_PUBLICOS[number] {
  return TIPOS_PUBLICOS.includes(valor as typeof TIPOS_PUBLICOS[number]);
}

export async function resumirPreciosPublicos(
  fechaReferencia: string,
  inventario: RepositorioInventarioAlojamiento,
  tarifas: RepositorioTarifas,
  tarifasAlimentacion: RepositorioTarifasAlimentacion,
) {
  const [catalogo, plan, desayuno, pensionCompleta] = await Promise.all([
    listarAlojamientosPublicos('general', inventario),
    tarifas.obtenerPublicada(),
    tarifasAlimentacion.obtenerPublicada('desayuno_incluido'),
    tarifasAlimentacion.obtenerPublicada('pension_completa'),
  ]);

  if (!plan) return null;

  const opcionesPorTipo = new Map<string, {
    tipo: typeof TIPOS_PUBLICOS[number];
    modalidades: Set<string>;
    capacidadComercial: number;
  }>();

  for (const espacio of catalogo) {
    if (!esTipoPublico(espacio.tipo)) continue;
    const actual = opcionesPorTipo.get(espacio.tipo) || {
      tipo: espacio.tipo,
      modalidades: new Set<string>(),
      capacidadComercial: 0,
    };
    actual.capacidadComercial = Math.max(actual.capacidadComercial, espacio.capacidad_comercial);
    espacio.modalidades.forEach(item => actual.modalidades.add(item.codigo));
    opcionesPorTipo.set(espacio.tipo, actual);
  }

  const opciones = TIPOS_PUBLICOS.flatMap(tipo => {
    const opcion = opcionesPorTipo.get(tipo);
    if (!opcion) return [];
    const reglas = plan.reglasPrecio.filter(regla =>
      regla.tipoAlojamiento === tipo &&
      regla.fechaDesde <= fechaReferencia &&
      regla.fechaHasta >= fechaReferencia &&
      regla.diasSemana.includes(diaSemanaIso(fechaReferencia)) &&
      (regla.modalidad === 'cualquiera' || opcion.modalidades.has(regla.modalidad))
    );
    return [{
      tipo_alojamiento: tipo,
      modalidades: Array.from(opcion.modalidades),
      capacidad_comercial: opcion.capacidadComercial,
      tarifas: reglas.map(regla => ({
        temporada_codigo: regla.temporadaCodigo,
        fecha_desde: regla.fechaDesde,
        fecha_hasta: regla.fechaHasta,
        prioridad: regla.prioridad,
        dias_semana: regla.diasSemana,
        modalidad: regla.modalidad,
        ocupacion_min: regla.ocupacionMin,
        ocupacion_max: regla.ocupacionMax,
        base_calculo: regla.baseCalculo,
        importe_centavos: regla.importeCentavos,
      })),
    }];
  });

  return {
    fecha_referencia: fechaReferencia,
    plan: { codigo: plan.codigo, version: plan.version, moneda: plan.moneda },
    alimentacion: {
      desayuno_incluido: desayuno ? {
        version: desayuno.version,
        precio_comida_centavos: desayuno.precioComidaCentavos,
        comidas_adicionales_por_persona_noche: desayuno.comidasAdicionalesPorPersonaNoche,
      } : null,
      pension_completa: pensionCompleta ? {
        version: pensionCompleta.version,
        precio_comida_centavos: pensionCompleta.precioComidaCentavos,
        comidas_adicionales_por_persona_noche: pensionCompleta.comidasAdicionalesPorPersonaNoche,
        adicional_por_persona_noche_centavos:
          pensionCompleta.precioComidaCentavos * pensionCompleta.comidasAdicionalesPorPersonaNoche,
      } : null,
    },
    opciones,
  };
}
