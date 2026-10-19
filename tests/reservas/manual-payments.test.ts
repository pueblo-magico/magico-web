import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { onRequestPost as registrarPagoAdmin } from '../../functions/api/v1/admin/reservas/[id]/pagos.ts';
import { D1RepositorioHistorialReserva } from '../../functions/_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
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
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

function crearReservaPendiente(sqlite: DatabaseSync): number {
  return Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen,
      monto_total_centavos, monto_sena_centavos, moneda, hold_expires_at
    ) VALUES (
      'Pago Manual QA', 'pago-manual@example.com', 1, '2099-11-20', '2099-11-22',
      2, 100, 25, 'pendiente', 'Web', 10000, 2500, 'ARS', '2099-11-19T00:00:00.000Z'
    ) RETURNING id
  `).get()?.id);
}

test('registra seña manual, confirma la reserva y despacha emails a huésped y equipo', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReservaPendiente(sqlite);
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('pagos@test', 'x', 'super_admin')");
  const secret = 'session-secret-pagos-manuales-32-caracteres';
  const csrf = 'csrf-pagos-manuales';
  const token = await createSessionToken('pagos@test', secret, csrf);
  const version = Number(sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(reservaId)?.version);
  const env = {
    DB: d1(sqlite), SESSION_SECRET: secret,
    INTEGRATION_OUTBOX_ENABLED: 'true',
    INTEGRATION_EVENTS_WEBHOOK_URL: 'https://n8n.example.test/webhook/reservas',
    INTEGRATION_EVENTS_WEBHOOK_SECRET: 'webhook-secret-seguro-123456789',
  };
  const headers = {
    'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
    Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
  };
  const enviados: Record<string, unknown>[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    enviados.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(null, { status: 204 });
  };
  let tarea: Promise<unknown> | undefined;

  try {
    const response = await registrarPagoAdmin({
      request: new Request(`https://test/api/v1/admin/reservas/${reservaId}/pagos`, {
        method: 'POST', headers, body: JSON.stringify({
          expected_version: version, tipo: 'sena', metodo: 'transferencia_mp',
          monto_centavos: 2500, moneda: 'ARS', referencia: 'OP-12345',
          pagado_at: '2026-10-19T12:00:00.000Z',
          motivo: 'Comprobante verificado por administración',
          idempotency_key: 'manual-payment-qa-0001',
        }),
      }),
      env, params: { id: String(reservaId) },
      waitUntil(promesa: Promise<unknown>) { tarea = promesa; },
    });
    assert.equal(response.status, 201);
    const body = await response.json() as any;
    assert.equal(body.data.reservaConfirmada, true);
    assert.equal(body.data.pagadoCentavos, 2500);
    assert.equal(body.data.saldoCentavos, 7500);
    assert.ok(tarea);
    await tarea;

    const pago = sqlite.prepare(`
      SELECT proveedor, tipo, estado, monto_centavos, metodo_registro,
        referencia_manual, registrado_por
      FROM pagos WHERE idempotency_key = 'manual-payment-qa-0001'
    `).get();
    assert.deepEqual({ ...pago }, {
      proveedor: 'manual', tipo: 'sena', estado: 'aprobado', monto_centavos: 2500,
      metodo_registro: 'transferencia_mp', referencia_manual: 'OP-12345',
      registrado_por: 'pagos@test',
    });
    assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas WHERE id = ?').get(reservaId)?.estado_flujo, 'confirmada');
    assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM auditoria_admin
      WHERE entidad_tipo = 'reserva' AND entidad_id = ? AND accion = 'registrar_pago_reserva'`).get(String(reservaId))?.n, 1);
    assert.equal(enviados.length, 2);
    assert.deepEqual(new Set(enviados.map(evento => evento.audience)), new Set(['huesped', 'equipo']));
    assert.equal(enviados.every(evento => evento.intent_type === 'pago_aprobado'), true);

    const repetida = await registrarPagoAdmin({
      request: new Request(`https://test/api/v1/admin/reservas/${reservaId}/pagos`, {
        method: 'POST', headers, body: JSON.stringify({
          expected_version: version, tipo: 'sena', metodo: 'transferencia_mp',
          monto_centavos: 2500, moneda: 'ARS', referencia: 'OP-12345',
          pagado_at: '2026-10-19T12:00:00.000Z',
          motivo: 'Comprobante verificado por administración',
          idempotency_key: 'manual-payment-qa-0001',
        }),
      }), env, params: { id: String(reservaId) },
    });
    assert.equal(repetida.status, 201);
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'manual'").get()?.n, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
  sqlite.close();
});

test('registra el saldo sin reenviar la confirmación y deja la reserva pagada', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReservaPendiente(sqlite);
  sqlite.prepare("UPDATE reservas SET estado = 'confirmada', estado_flujo = 'confirmada' WHERE id = ?").run(reservaId);
  sqlite.prepare(`
    INSERT INTO pagos (reserva_id, proveedor, tipo, estado, monto_centavos, moneda, idempotency_key)
    VALUES (?, 'mercado_pago', 'sena', 'aprobado', 2500, 'ARS', 'deposito-previo')
  `).run(reservaId);
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('saldo@test', 'x', 'super_admin')");
  const secret = 'session-secret-saldo-manual-32-caracteres';
  const csrf = 'csrf-saldo-manual';
  const token = await createSessionToken('saldo@test', secret, csrf);
  const version = Number(sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(reservaId)?.version);
  let despacho = false;
  const response = await registrarPagoAdmin({
    request: new Request(`https://test/api/v1/admin/reservas/${reservaId}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
        Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      },
      body: JSON.stringify({
        expected_version: version, tipo: 'saldo', metodo: 'efectivo',
        monto_centavos: 7500, moneda: 'ARS', referencia: null,
        pagado_at: '2026-10-19T12:30:00.000Z', motivo: 'Saldo cobrado al momento del ingreso',
        idempotency_key: 'manual-payment-qa-saldo-0001',
      }),
    }),
    env: { DB: d1(sqlite), SESSION_SECRET: secret },
    params: { id: String(reservaId) },
    waitUntil() { despacho = true; },
  });
  assert.equal(response.status, 201);
  const body = await response.json() as any;
  assert.equal(body.data.reservaConfirmada, false);
  assert.equal(body.data.pagadoCentavos, 10000);
  assert.equal(body.data.saldoCentavos, 0);
  assert.equal(despacho, false);

  const historial = await new D1RepositorioHistorialReserva(d1(sqlite)).obtener(reservaId);
  assert.equal(historial?.resumenFinanciero.estado, 'pagado_total');
  assert.equal(historial?.resumenFinanciero.totalCentavos, 10000);
  assert.equal(historial?.resumenFinanciero.netoCentavos, 10000);
  assert.equal(historial?.resumenFinanciero.saldoPendienteCentavos, 0);
  sqlite.close();
});

test('un editor sin permiso financiero no puede registrar pagos', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReservaPendiente(sqlite);
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('editor-pagos@test', 'x', 'editor')");
  const secret = 'session-secret-editor-pagos-32-caracteres';
  const csrf = 'csrf-editor-pagos';
  const token = await createSessionToken('editor-pagos@test', secret, csrf);
  const response = await registrarPagoAdmin({
    request: new Request(`https://test/api/v1/admin/reservas/${reservaId}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
        Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      },
      body: '{}',
    }),
    env: { DB: d1(sqlite), SESSION_SECRET: secret }, params: { id: String(reservaId) },
  });
  assert.equal(response.status, 403);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'manual'").get()?.n, 0);
  sqlite.close();
});
