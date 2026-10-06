import assert from 'node:assert/strict';
import test from 'node:test';

import { cotizarConPlan, type ConfiguracionTarifa } from '../../functions/_domain/reservas/ratePlans.ts';
import { D1RepositorioTarifas } from '../../functions/_infrastructure/d1/D1RepositorioTarifas.ts';

const base: ConfiguracionTarifa = {
  planId: 1, codigo: 'base', version: 2, moneda: 'ARS',
  reglasPrecio: [
    { temporadaCodigo: 'baja', fechaDesde: '2026-01-01', fechaHasta: '2026-06-30', prioridad: 0,
      tipoAlojamiento: 'domo', modalidad: 'cualquiera', ocupacionMin: 1, ocupacionMax: 7,
      baseCalculo: 'persona_noche', importeCentavos: 10_000, exclusividadDesde: 6, exclusividadHasta: 7 },
    { temporadaCodigo: 'alta', fechaDesde: '2026-07-01', fechaHasta: '2026-12-31', prioridad: 0,
      tipoAlojamiento: 'domo', modalidad: 'cualquiera', ocupacionMin: 1, ocupacionMax: 7,
      baseCalculo: 'persona_noche', importeCentavos: 20_000, exclusividadDesde: 6, exclusividadHasta: 7 },
  ],
  reglasSena: [
    { subtotalDesdeCentavos: 0, subtotalHastaCentavos: 100_000, tipo: 'porcentaje_bps', valor: 5000 },
    { subtotalDesdeCentavos: 100_001, subtotalHastaCentavos: null, tipo: 'porcentaje_bps', valor: 3000 },
  ],
};

test('cotiza cada noche con su temporada y usa enteros en unidades menores', () => {
  const resultado = cotizarConPlan(
    { tipo: 'domo', personas: 2, fechaEntrada: '2026-06-30', fechaSalida: '2026-07-02' }, base
  );
  assert.ok(!('error' in resultado));
  assert.equal(resultado.subtotalCentavos, 60_000);
  assert.equal(resultado.senaCentavos, 30_000);
  assert.deepEqual(resultado.noches.map(n => n.temporada), ['baja', 'alta']);
});

test('rechaza noches sin tarifa, reglas ambiguas y bandas de seña ausentes', () => {
  const solicitud = { tipo: 'domo' as const, personas: 2, fechaEntrada: '2027-01-01', fechaSalida: '2027-01-02' };
  assert.deepEqual(cotizarConPlan(solicitud, base), { error: 'TARIFA_NO_CONFIGURADA' });

  const ambigua = { ...base, reglasPrecio: [...base.reglasPrecio, { ...base.reglasPrecio[0] }] };
  assert.deepEqual(cotizarConPlan({ ...solicitud, fechaEntrada: '2026-01-02', fechaSalida: '2026-01-03' }, ambigua), { error: 'TARIFA_AMBIGUA' });

  assert.deepEqual(cotizarConPlan(
    { ...solicitud, fechaEntrada: '2026-01-02', fechaSalida: '2026-01-03' },
    { ...base, reglasSena: [] }
  ), { error: 'SENA_NO_CONFIGURADA' });
});

test('aplica importe fijo y exclusividad sólo dentro de la banda configurada', () => {
  const resultado = cotizarConPlan(
    { tipo: 'domo', personas: 6, fechaEntrada: '2026-01-02', fechaSalida: '2026-01-03' },
    { ...base, reglasSena: [{ subtotalDesdeCentavos: 0, subtotalHastaCentavos: null, tipo: 'importe_fijo', valor: 12_345 }] }
  );
  assert.ok(!('error' in resultado));
  assert.equal(resultado.senaCentavos, 12_345);
  assert.equal(resultado.exclusividadGratis, true);
});

test('el repositorio D1 carga y normaliza el plan publicado', async () => {
  const bindings: unknown[][] = [];
  const db = {
    prepare(query: string) {
      return {
        bind(...values: unknown[]) { bindings.push(values); return this; },
        async first() {
          return query.includes('FROM planes_tarifa')
            ? { id: '9', codigo: 'alojamiento-base', version: '3', moneda: 'ARS' }
            : null;
        },
        async all() {
          if (query.includes('FROM reglas_precio')) return { results: [{
            temporada_codigo: 'base', fecha_desde: '2026-01-01', fecha_hasta: '2026-12-31', prioridad: '2',
            tipo_alojamiento: 'domo', modalidad: 'cualquiera', ocupacion_min: '1', ocupacion_max: '7',
            base_calculo: 'unidad_noche', importe_centavos: '5000', exclusividad_desde: null, exclusividad_hasta: null,
          }] };
          return { results: [{ subtotal_desde_centavos: '0', subtotal_hasta_centavos: null, tipo: 'importe_fijo', valor: '1000' }] };
        },
      };
    },
  };
  const configuracion = await new D1RepositorioTarifas(db).obtenerPublicada();
  assert.equal(configuracion?.planId, 9);
  assert.equal(configuracion?.reglasPrecio[0].importeCentavos, 5000);
  assert.equal(configuracion?.reglasSena[0].subtotalHastaCentavos, null);
  assert.deepEqual(bindings, [[9], [9]]);
});

test('el repositorio D1 devuelve null si no existe un plan publicado', async () => {
  const db = {
    prepare() {
      return { bind() { return this; }, async first() { return null; }, async all() { return { results: [] }; } };
    },
  };
  assert.equal(await new D1RepositorioTarifas(db).obtenerPublicada(), null);
});
