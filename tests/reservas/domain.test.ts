import assert from 'node:assert/strict';
import test from 'node:test';

import { cotizarEstadia } from '../../functions/_application/reservas/cotizarEstadia.ts';
import type { RepositorioCotizaciones, RepositorioDisponibilidad, RepositorioTarifas } from '../../functions/_application/reservas/ports.ts';
import { nochesEntre } from '../../functions/_domain/reservas/dateRange.ts';
import { mensajePrivacidad } from '../../functions/_domain/reservas/pricing.ts';
import type { ConfiguracionTarifa } from '../../functions/_domain/reservas/ratePlans.ts';

const disponible: RepositorioDisponibilidad = {
  async consultar() {
    return { estado: 'disponible', alojamiento_id: 7 };
  },
};

const configuracion: ConfiguracionTarifa = {
  planId: 1, codigo: 'alojamiento-base', version: 1, moneda: 'ARS',
  reglasPrecio: [
    ['domo', 1, 1, 'unidad_noche', 15_000_000, null, null],
    ['domo', 2, 2, 'unidad_noche', 7_500_000, null, null],
    ['domo', 3, 5, 'persona_noche', 6_500_000, null, null],
    ['domo', 6, 7, 'persona_noche', 5_000_000, 6, 7],
    ['refugio', 1, 15, 'persona_noche', 3_500_000, 3, 7],
  ].map(([tipo, min, max, base, importe, exclusivaDesde, exclusivaHasta]) => ({
    temporadaCodigo: 'base', fechaDesde: '2000-01-01', fechaHasta: '2099-12-31', prioridad: 0,
    tipoAlojamiento: tipo as any, modalidad: 'cualquiera' as const,
    ocupacionMin: Number(min), ocupacionMax: Number(max), baseCalculo: base as any,
    importeCentavos: Number(importe), exclusividadDesde: exclusivaDesde as number | null,
    exclusividadHasta: exclusivaHasta as number | null,
  })),
  reglasSena: [
    { subtotalDesdeCentavos: 0, subtotalHastaCentavos: 10_000_000, tipo: 'porcentaje_bps', valor: 5000 },
    { subtotalDesdeCentavos: 10_000_001, subtotalHastaCentavos: null, tipo: 'porcentaje_bps', valor: 3000 },
  ],
};
const tarifas: RepositorioTarifas = { async obtenerPublicada() { return configuracion; } };
const cotizaciones: RepositorioCotizaciones = {
  async guardar() { return { id: 10, codigo: 'COT-10', expiresAt: '2026-10-01T00:15:00.000Z' }; },
};

test('calcula noches con checkout exclusivo', () => {
  assert.equal(nochesEntre('2026-10-10', '2026-10-11'), 1);
  assert.equal(nochesEntre('2026-10-10', '2026-10-13'), 3);
  assert.equal(nochesEntre('2026-10-10', '2026-10-10'), null);
  assert.equal(nochesEntre('fecha-invalida', '2026-10-11'), null);
  assert.equal(nochesEntre('2027-02-30', '2027-03-03'), null);
});

test('expone el mensaje legacy de privacidad del refugio', () => {
  assert.notEqual(mensajePrivacidad('refugio', 4), '');
  assert.equal(mensajePrivacidad('refugio', 5), '');
});

test('cotiza a través de un puerto sin depender de D1 o Workers', async () => {
  const resultado = await cotizarEstadia(
    { tipo: 'refugio', personas: 2, fechaEntrada: '2026-10-10', fechaSalida: '2026-10-12' },
    disponible,
    tarifas,
    cotizaciones
  );

  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.valor.disponibilidad.alojamiento_id, 7);
  assert.equal(resultado.valor.desglose.subtotal, 140_000);
  assert.deepEqual(resultado.valor.sena, { porcentaje: 0.3, monto: 42_000, monto_centavos: 4_200_000 });
  assert.equal(resultado.valor.desglose.plan_version, 1);
  assert.equal(resultado.valor.saldoCheckin, 98_000);
});

test('rechaza fechas inválidas antes de consultar disponibilidad', async () => {
  const noDebeConsultarse: RepositorioDisponibilidad = {
    async consultar() {
      throw new Error('El repositorio no debe ejecutarse para una solicitud inválida.');
    },
  };

  const resultado = await cotizarEstadia(
    { tipo: 'domo', personas: 2, fechaEntrada: '2026-10-12', fechaSalida: '2026-10-10' },
    noDebeConsultarse,
    tarifas,
    cotizaciones
  );

  assert.deepEqual(resultado, {
    ok: false,
    error: {
      codigo: 'FECHAS_INVALIDAS',
      mensaje: 'Fechas inválidas: fecha_salida debe ser posterior a fecha_entrada.',
    },
  });

  const fechaNormalizable = await cotizarEstadia(
    { tipo: 'domo', personas: 2, fechaEntrada: '2027-02-30', fechaSalida: '2027-03-03' },
    noDebeConsultarse,
    tarifas,
    cotizaciones
  );
  assert.deepEqual(fechaNormalizable, resultado);
});

test('rechaza ocupación inválida antes de consultar disponibilidad', async () => {
  const noDebeConsultarse: RepositorioDisponibilidad = {
    async consultar() {
      throw new Error('El repositorio no debe ejecutarse para una solicitud inválida.');
    },
  };

  const resultado = await cotizarEstadia(
    { tipo: 'domo', personas: 8, fechaEntrada: '2026-10-10', fechaSalida: '2026-10-12' },
    noDebeConsultarse,
    tarifas,
    cotizaciones
  );

  assert.deepEqual(resultado, {
    ok: false,
    error: {
      codigo: 'OCUPACION_INVALIDA',
      mensaje: 'El Domo admite entre 1 y 7 personas.',
    },
  });
});
