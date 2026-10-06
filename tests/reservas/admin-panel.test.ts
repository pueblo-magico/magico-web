import assert from 'node:assert/strict';
import test from 'node:test';

import { consultarPanelReservas } from '../../functions/_application/reservas/consultarPanelReservas.ts';
import type { RepositorioPanelReservas } from '../../functions/_application/reservas/ports.ts';
import { calcularMetricasPanelReservas } from '../../functions/_domain/reservas/adminMetrics.ts';
import type { ReservaPanel } from '../../functions/_domain/reservas/models.ts';

function reserva(overrides: Partial<ReservaPanel>): ReservaPanel {
  return {
    id: 1,
    version: 1,
    cliente_nombre: 'Huésped',
    cliente_telefono: null,
    cliente_email: null,
    alojamiento_id: 1,
    alojamiento_nombre: 'Refugio',
    alojamiento_tipo: 'refugio',
    fecha_checkin: '2026-10-05',
    fecha_checkout: '2026-10-06',
    cantidad_personas: 2,
    monto_total: 100_000,
    monto_sena: 30_000,
    estado: 'confirmada',
    unidad_asignada: null,
    canal_origen: 'Manual',
    mp_preference_id: null,
    mp_payment_id: null,
    manychat_user_id: null,
    created_at: '2026-10-01T12:00:00Z',
    ...overrides,
  };
}

test('calcula las métricas operativas sin depender del handler', () => {
  const confirmadaHoy = reserva({ id: 1 });
  const confirmadaSemana = reserva({
    id: 2,
    fecha_checkin: '2026-10-08',
    fecha_checkout: '2026-10-10',
    monto_total: 200_000,
    monto_sena: null,
  });
  const pendiente = reserva({ id: 3, estado: 'pendiente_pago', monto_total: 50_000, monto_sena: 10_000 });

  const metricas = calcularMetricasPanelReservas(
    [confirmadaHoy, confirmadaSemana, pendiente],
    [{
      id: 9,
      cliente_nombre: 'Pendiente',
      cliente_telefono: null,
      monto_sena: 5_000,
      created_at: '2026-09-01T00:00:00Z',
      alojamiento_nombre: 'Domo 1',
    }],
    { total: 4, confirmadas: 3 },
    3,
    new Date('2026-10-05T12:00:00Z')
  );

  assert.equal(metricas.total_confirmadas, 2);
  assert.equal(metricas.ingresos_senas, 30_000);
  assert.equal(metricas.checkins_hoy, 1);
  assert.equal(metricas.checkins_semana, 2);
  assert.equal(metricas.checkouts_hoy, 0);
  assert.equal(metricas.saldo_pendiente_total, 270_000);
  assert.equal(metricas.total_a_facturar, 350_000);
  assert.equal(metricas.pendientes_viejas.cantidad, 1);
  assert.equal(metricas.conversion_manychat.pct, 75);
});

test('usa la vista operativa sin consultar historial', async () => {
  let historialConsultado = false;
  const operativas = [reserva({ id: 1 })];
  const repository: RepositorioPanelReservas = {
    async listarAlojamientos() { return []; },
    async listarReservasOperativas() { return operativas; },
    async listarHistorial() { historialConsultado = true; return []; },
    async listarPendientesViejas() { return []; },
    async obtenerConversionManyChat() { return { total: 0, confirmadas: 0 }; },
  };

  const panel = await consultarPanelReservas('operativa', repository, new Date('2026-10-05T12:00:00Z'));
  assert.equal(panel.reservas, operativas);
  assert.equal(panel.vista, 'operativa');
  assert.equal(historialConsultado, false);
  assert.equal(panel.metricas.conversion_manychat.pct, null);
});

test('consulta historial sólo cuando se solicita', async () => {
  const historial = [reserva({ id: 10, estado: 'cancelada' })];
  const repository: RepositorioPanelReservas = {
    async listarAlojamientos() { return []; },
    async listarReservasOperativas() { return []; },
    async listarHistorial() { return historial; },
    async listarPendientesViejas() { return []; },
    async obtenerConversionManyChat() { return { total: 0, confirmadas: 0 }; },
  };

  const panel = await consultarPanelReservas('historial', repository, new Date('2026-10-05T12:00:00Z'));
  assert.equal(panel.reservas, historial);
  assert.equal(panel.vista, 'historial');
});
