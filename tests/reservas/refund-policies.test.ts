import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { calcularDevolucion } from '../../functions/_domain/reservas/refundPolicies.ts';

function baseMigrada() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

test('no inventa una devolución cuando la configuración comercial está pendiente', () => {
  const resultado = calcularDevolucion({
    snapshot: {
      codigo: 'reservas-general', version: 1,
      estadoConfiguracion: 'pendiente_configuracion', reglas: [],
    },
    montoPagadoCentavos: 10_000,
    canceladaAt: '2027-01-08T12:00:00.000Z',
    inicioEstadiaAt: '2027-01-10T12:00:00.000Z',
  });
  assert.deepEqual(resultado, { ok: false, codigo: 'CONFIGURACION_PENDIENTE' });
});

test('calcula de forma determinista la regla configurada más específica', () => {
  const resultado = calcularDevolucion({
    snapshot: {
      codigo: 'qa-politica', version: 3, estadoConfiguracion: 'configurada',
      reglas: [
        { horasMinimasAntes: 0, porcentajeDevolucionBps: 0 },
        { horasMinimasAntes: 24, porcentajeDevolucionBps: 5_000 },
        { horasMinimasAntes: 72, porcentajeDevolucionBps: 10_000 },
      ],
    },
    montoPagadoCentavos: 12_345,
    canceladaAt: '2027-01-08T12:00:00.000Z',
    inicioEstadiaAt: '2027-01-10T12:00:00.000Z',
  });
  assert.deepEqual(resultado, {
    ok: true, montoCentavos: 6_172, porcentajeDevolucionBps: 5_000,
    clasificacion: 'parcial', politicaCodigo: 'qa-politica', politicaVersion: 3,
  });
});

test('rechaza políticas ambiguas y no aplica una regla implícita', () => {
  const base = {
    montoPagadoCentavos: 10_000,
    canceladaAt: '2027-01-09T12:00:00.000Z',
    inicioEstadiaAt: '2027-01-10T12:00:00.000Z',
  };
  assert.deepEqual(calcularDevolucion({
    ...base,
    snapshot: {
      codigo: 'duplicada', version: 1, estadoConfiguracion: 'configurada',
      reglas: [
        { horasMinimasAntes: 24, porcentajeDevolucionBps: 5_000 },
        { horasMinimasAntes: 24, porcentajeDevolucionBps: 0 },
      ],
    },
  }), { ok: false, codigo: 'POLITICA_INVALIDA' });

  assert.deepEqual(calcularDevolucion({
    ...base,
    canceladaAt: '2027-01-10T13:00:00.000Z',
    snapshot: {
      codigo: 'sin-regla-tardia', version: 1, estadoConfiguracion: 'configurada',
      reglas: [{ horasMinimasAntes: 24, porcentajeDevolucionBps: 5_000 }],
    },
  }), { ok: false, codigo: 'REGLA_NO_DEFINIDA' });
});

test('migra con política pendiente, snapshots inmutables y devoluciones trazables', () => {
  const db = baseMigrada();
  const politica = db.prepare(`
    SELECT codigo, version, estado, reglas_json FROM politicas_cancelacion
  `).get() as any;
  assert.deepEqual({ ...politica }, {
    codigo: 'reservas-general', version: 1, estado: 'pendiente_configuracion',
    reglas_json: '{"estado":"pendiente_configuracion","reglas":[]}',
  });

  const reservaId = Number(db.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA políticas', 1, '2027-01-10', '2027-01-12', 2, 100, 'pendiente', 'QA')
    RETURNING id
  `).get()?.id);
  const snapshot = db.prepare(`
    SELECT id, estado_configuracion FROM reserva_politica_snapshots WHERE reserva_id = ?
  `).get(reservaId) as any;
  assert.equal(snapshot.estado_configuracion, 'pendiente_configuracion');
  assert.throws(
    () => db.prepare("UPDATE reserva_politica_snapshots SET codigo = 'otro' WHERE id = ?").run(snapshot.id),
    /reservation policy snapshots are immutable/
  );

  const pagoId = Number(db.prepare(`
    INSERT INTO pagos (
      reserva_id, proveedor, tipo, estado, monto_centavos, moneda, idempotency_key
    ) VALUES (?, 'qa', 'sena', 'aprobado', 10000, 'ARS', 'pago-qa-1') RETURNING id
  `).get(reservaId)?.id);
  db.prepare(`
    INSERT INTO devoluciones_reserva (
      reserva_id, pago_original_id, politica_snapshot_id,
      monto_centavos, moneda, idempotency_key
    ) VALUES (?, ?, ?, 5000, 'ARS', 'devolucion-qa-1')
  `).run(reservaId, pagoId, snapshot.id);
  assert.throws(() => db.prepare(`
    INSERT INTO devoluciones_reserva (
      reserva_id, pago_original_id, politica_snapshot_id,
      monto_centavos, moneda, idempotency_key
    ) VALUES (?, ?, ?, 5000, 'ARS', 'devolucion-qa-1')
  `).run(reservaId, pagoId, snapshot.id), /UNIQUE constraint failed/);
  db.close();
});
