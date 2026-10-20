import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { consultarHistorialReserva } from '../../functions/_application/reservas/consultarHistorialReserva.ts';
import { D1RepositorioEstadoPagoReserva } from '../../functions/_infrastructure/d1/D1RepositorioEstadoPagoReserva.ts';
import { D1RepositorioHistorialReserva } from '../../functions/_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { onRequestGet as historialAdmin } from '../../functions/api/v1/admin/reservas/[id]/historial.ts';
import { transicionPagoValida } from '../../functions/_domain/reservas/paymentLifecycle.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre))
    .sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

function d1(sqlite: DatabaseSync) {
  return {
    prepare(query: string) {
      let values: SQLInputValue[] = [];
      return {
        bind(...bindings: unknown[]) { values = bindings as SQLInputValue[]; return this; },
        async first() { return sqlite.prepare(query).get(...values) as Record<string, unknown> | undefined || null; },
        async all() { return { results: sqlite.prepare(query).all(...values) as Record<string, unknown>[] }; },
        async run() { return sqlite.prepare(query).run(...values); },
      };
    },
    async batch(statements: { run(): Promise<unknown> }[]) {
      sqlite.exec('BEGIN');
      try {
        const resultados = [];
        for (const statement of statements) resultados.push(await statement.run());
        sqlite.exec('COMMIT');
        return resultados;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

function crearReserva(sqlite: DatabaseSync): number {
  return Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen,
      hold_expires_at
    ) VALUES ('QA HISTORIAL', 1, '2099-09-10', '2099-09-12', 2,
      100, 25, 'pendiente', 'QA', '2099-09-01T00:00:00.000Z')
    RETURNING id
  `).get()?.id);
}

test('registra múltiples intentos correlacionados y arma el resumen financiero', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  const db = d1(sqlite);
  const pagos = new D1RepositorioEstadoPagoReserva(db);

  await pagos.registrarPago({
    proveedor: 'mercado_pago', eventoExternoId: 'delivery-1', correlationId: 'request-1',
    pago: { id: 'pay-rejected', estado: 'rejected', referenciaExterna: String(reservaId), montoCentavos: 2500, moneda: 'ARS' },
    reservaId, resultado: 'aplicado', motivoCodigo: null,
  }, 'rechazado');
  await pagos.registrarPago({
    proveedor: 'mercado_pago', eventoExternoId: 'delivery-2', correlationId: 'request-2',
    pago: { id: 'pay-approved', estado: 'approved', referenciaExterna: String(reservaId), montoCentavos: 2500, moneda: 'ARS' },
    reservaId, resultado: 'aplicado', motivoCodigo: null,
  }, 'aprobado');

  const historial = await consultarHistorialReserva(reservaId, new D1RepositorioHistorialReserva(db));
  assert.equal(historial?.resumenFinanciero.intentos, 2);
  assert.equal(historial?.resumenFinanciero.aprobadoCentavos, 2500);
  assert.equal(historial?.resumenFinanciero.netoCentavos, 2500);
  assert.deepEqual(historial?.pagos.map(pago => pago.estado), ['rechazado', 'aprobado']);
  assert.deepEqual(historial?.pagos.map(pago => pago.correlationId), ['request-1', 'request-2']);
  assert.deepEqual(
    historial?.eventos.filter(evento => evento.tipo.startsWith('pago.')).map(evento => evento.tipo),
    ['pago.rechazado', 'pago.aprobado']
  );
  sqlite.close();
});

test('revierte el pago si no puede persistir su evento', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  sqlite.exec(`
    CREATE TRIGGER qa_fallar_evento_pago
    BEFORE INSERT ON reserva_eventos
    WHEN NEW.tipo LIKE 'pago.%'
    BEGIN SELECT RAISE(ABORT, 'qa event failure'); END;
  `);
  const pagos = new D1RepositorioEstadoPagoReserva(d1(sqlite));

  await assert.rejects(() => pagos.registrarPago({
    proveedor: 'mercado_pago', eventoExternoId: 'delivery-fail', correlationId: 'request-fail',
    pago: { id: 'pay-fail', estado: 'approved', referenciaExterna: String(reservaId), montoCentavos: 2500, moneda: 'ARS' },
    reservaId, resultado: 'aplicado', motivoCodigo: null,
  }, 'aprobado'), /qa event failure/);

  assert.equal(sqlite.prepare("SELECT COUNT(*) cantidad FROM pagos WHERE external_payment_id = 'pay-fail'").get()?.cantidad, 0);
  sqlite.close();
});

test('los eventos del ciclo de vida son append-only', () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  const eventoId = Number(sqlite.prepare(`
    INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, evento_uid)
    VALUES (?, 'reserva.qa', 'sistema', 'qa-evento-1') RETURNING id
  `).get(reservaId)?.id);

  assert.throws(
    () => sqlite.prepare("UPDATE reserva_eventos SET tipo = 'reserva.alterada' WHERE id = ?").run(eventoId),
    /append-only/
  );
  assert.throws(() => sqlite.prepare('DELETE FROM reserva_eventos WHERE id = ?').run(eventoId), /append-only/);
  assert.throws(
    () => sqlite.prepare(`
      INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, evento_uid)
      VALUES (?, 'reserva.qa', 'sistema', 'qa-evento-1')
    `).run(reservaId),
    /UNIQUE constraint failed/
  );
  sqlite.close();
});

test('el dominio impide regresiones de estado en un mismo intento', () => {
  assert.equal(transicionPagoValida('pendiente', 'aprobado'), true);
  assert.equal(transicionPagoValida('aprobado', 'devuelto'), true);
  assert.equal(transicionPagoValida('aprobado', 'pendiente'), false);
  assert.equal(transicionPagoValida('devuelto', 'aprobado'), false);
  assert.equal(transicionPagoValida('rechazado', 'aprobado'), false);
});

test('el historial administrativo exige sesión antes de consultar D1', async () => {
  const response = await historialAdmin({
    request: new Request('https://test/api/v1/admin/reservas/1/historial'),
    env: { SESSION_SECRET: 'session-secret-seguro-de-al-menos-32-caracteres' },
    params: { id: '1' },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado.' });
});
