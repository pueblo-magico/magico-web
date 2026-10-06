import assert from 'node:assert/strict';
import test from 'node:test';

import { cotizarConPlan, type ConfiguracionTarifa } from '../../functions/_domain/reservas/ratePlans.ts';
import { D1RepositorioTarifas } from '../../functions/_infrastructure/d1/D1RepositorioTarifas.ts';
import { D1RepositorioCotizaciones } from '../../functions/_infrastructure/d1/D1RepositorioCotizaciones.ts';

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

test('persiste un snapshot con código, hash y vencimiento sin datos personales', async () => {
  let values: unknown[] = [];
  const db = {
    prepare() {
      return {
        bind(...args: unknown[]) { values = args; return this; },
        async first() { return { id: '42' }; },
      };
    },
  };
  const repo = new D1RepositorioCotizaciones(db);
  const guardada = await repo.guardar(
    { tipo: 'domo', personas: 2, fechaEntrada: '2026-10-10', fechaSalida: '2026-10-11' },
    {
      disponibilidad: { estado: 'disponible', alojamiento_id: 1 },
      desglose: {
        tipo_alojamiento: 'domo', cantidad_personas: 2, noches: 1, precio_por_noche: 75_000,
        subtotal: 75_000, exclusividad_gratis: false, moneda: 'ARS', subtotal_centavos: 7_500_000,
        alojamiento_centavos: 7_500_000, alimentacion_centavos: 0,
        regimen_alimentacion: 'desayuno_incluido', tarifa_alimentacion_version: 1,
        precio_comida_centavos: 2_000_000, comidas_adicionales_por_persona_noche: 0,
        plan_codigo: 'alojamiento-base', plan_version: 1,
        desglose_noches: [{ fecha: '2026-10-10', temporada: 'base', importe_centavos: 7_500_000 }],
      },
      sena: { porcentaje: 0.5, monto: 37_500, monto_centavos: 3_750_000 },
      saldoCheckin: 37_500,
      mensajePrivacidad: '',
    }
  );
  assert.equal(guardada.id, 42);
  assert.match(guardada.codigo, /^COT-[0-9a-f-]+$/);
  assert.ok(Date.parse(guardada.expiresAt) > Date.now());
  assert.equal(values[0], guardada.codigo);
  assert.match(String(values[15]), /^[a-f0-9]{64}$/);
  assert.equal(String(values[14]).includes('cliente'), false);
});

test('falla cerrado si D1 no devuelve el snapshot insertado', async () => {
  const db = { prepare() { return { bind() { return this; }, async first() { return null; } }; } };
  const repo = new D1RepositorioCotizaciones(db, () => new Date(), () => 'COT-X');
  await assert.rejects(() => repo.guardar(
    { tipo: 'domo', personas: 1, fechaEntrada: '2026-01-01', fechaSalida: '2026-01-02' },
    {
      disponibilidad: { estado: 'disponible', alojamiento_id: 1 },
      desglose: { tipo_alojamiento: 'domo', cantidad_personas: 1, noches: 1, precio_por_noche: 1,
        subtotal: 1, exclusividad_gratis: false, moneda: 'ARS', subtotal_centavos: 100,
        alojamiento_centavos: 100, alimentacion_centavos: 0,
        regimen_alimentacion: 'desayuno_incluido', tarifa_alimentacion_version: 1,
        precio_comida_centavos: 2_000_000, comidas_adicionales_por_persona_noche: 0,
        plan_codigo: 'base', plan_version: 1, desglose_noches: [] },
      sena: { porcentaje: 1, monto: 1, monto_centavos: 100 }, saldoCheckin: 0, mensajePrivacidad: '',
    }
  ), /persistir/);
});
