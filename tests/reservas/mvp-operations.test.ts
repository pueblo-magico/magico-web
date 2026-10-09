import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { consultarOperacionesMvp } from '../../functions/_application/reservas/consultarOperacionesMvp.ts';
import { construirAlertasOperativas } from '../../functions/_domain/reservas/mvpOperations.ts';
import { D1RepositorioOperacionesMvp } from '../../functions/_infrastructure/d1/D1RepositorioOperacionesMvp.ts';
import { onRequestGet as consultarEstado } from '../../functions/api/v1/admin/integraciones/estado.ts';
import { onRequestPost as reprocesarComunicacion } from '../../functions/api/v1/admin/integraciones/comunicaciones/reprocesar.ts';
import { onRequestPost as expirarRetencionesAdmin } from '../../functions/api/v1/admin/integraciones/retenciones/expirar.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';

function baseCompleta() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  class Statement {
    private values: SQLInputValue[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
    bind(...values: unknown[]) { this.values = values as SQLInputValue[]; return this; }
    async first() { return sqlite.prepare(this.query).get(...this.values) as Record<string, unknown> || null; }
    async all() { return { results: sqlite.prepare(this.query).all(...this.values) as Record<string, unknown>[] }; }
    async run() { return sqlite.prepare(this.query).run(...this.values); }
  }
  const db = {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      const result = [];
      for (const statement of statements) result.push(await statement.run());
      return result;
    },
  };
  return { sqlite, db };
}

function sembrarFallas(sqlite: DatabaseSync) {
  const reservaId = Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, estado_flujo, hold_expires_at, codigo
    ) VALUES ('Persona privada', 'no-exponer@example.test', 1, '2099-10-10', '2099-10-12',
      2, 100, 'pendiente', 'pendiente_pago', '2099-10-01T09:00:00.000Z', 'RES-OPS-1')
    RETURNING id
  `).get()?.id);
  sqlite.prepare(`
    INSERT INTO retenciones_reserva (reserva_id, estado, expires_at)
    VALUES (?, 'activa', '2099-10-01T09:00:00.000Z')
  `).run(reservaId);
  sqlite.prepare(`
    INSERT INTO pago_eventos_externos (
      proveedor, evento_externo_id, external_payment_id, reserva_id, resultado,
      motivo_codigo, correlation_id, created_at
    ) VALUES ('mercado_pago', 'event-secret', 'payment-secret', ?, 'inconsistente',
      'MONTO_INCORRECTO', 'request-ops-1', '2099-10-01T09:55:00.000Z')
  `).run(reservaId);
  sqlite.prepare(`
    INSERT INTO reserva_eventos (
      reserva_id, tipo, actor_tipo, correlation_id, evento_uid, agregado_tipo, agregado_id
    ) VALUES (?, 'reserva.creada', 'sistema', 'request-ops-1', 'evento-ops-1', 'reserva', ?)
  `).run(reservaId, String(reservaId));
  sqlite.exec(`
    UPDATE integration_outbox SET estado = 'dead_letter', attempts = 8,
      last_error_code = 'N8N_TIMEOUT';
    UPDATE comunicacion_intenciones SET estado = 'sin_canal', attempts = 1,
      last_error_code = 'COMMUNICATION_CHANNEL_DISABLED';
  `);
}

test('consolida alertas del MVP y no devuelve PII ni payloads externos', async () => {
  const { sqlite, db } = baseCompleta();
  sembrarFallas(sqlite);
  const estado = await consultarOperacionesMvp(
    new D1RepositorioOperacionesMvp(db), 20,
    () => new Date('2099-10-01T10:00:00.000Z')
  );
  assert.equal(estado.reservas.pendientesPago, 1);
  assert.equal(estado.reservas.retencionesVencidasSinProcesar, 1);
  assert.equal(estado.pagos.inconsistentesLast24h, 1);
  assert.equal(estado.pagos.eventos[0].correlationId, 'request-ops-1');
  assert.equal(estado.outbox.resumen.dead_letter >= 2, true);
  assert.equal(estado.comunicaciones.resumen.sin_canal, 1);
  assert.deepEqual(estado.tendenciaColas.outbox, {
    creadosPendientesUltimos15m: 0,
    creadosPendientes15mAnteriores: 0,
    crecimiento: 0,
  });
  assert.deepEqual(estado.alertas.map(alerta => alerta.codigo).sort(), [
    'COMUNICACIONES_PENDIENTES', 'OUTBOX_DEAD_LETTER',
    'PAGOS_INCONSISTENTES', 'RETENCIONES_VENCIDAS',
  ]);
  assert.doesNotMatch(JSON.stringify(estado), /Persona privada|no-exponer@example|payment-secret|event-secret/);
  sqlite.close();
});

test('alerta por antigüedad y tasa de error sin inventar alertas en una cola vacía', async () => {
  const { sqlite, db } = baseCompleta();
  const estado = await consultarOperacionesMvp(
    new D1RepositorioOperacionesMvp(db), 999,
    () => new Date('2099-10-01T10:00:00.000Z')
  );
  assert.equal(estado.reservas.oldestPendingAgeSeconds, null);
  assert.equal(estado.pagos.webhooksLast24h, 0);
  assert.deepEqual(estado.alertas, []);
  const alertas = construirAlertasOperativas({
    ...estado,
    outbox: {
      ...estado.outbox,
      resumen: { ...estado.outbox.resumen, pending: 3 },
      oldestPendingAgeSeconds: 901,
      deliveryLast24h: { attempts: 5, failures: 1, failureRate: 0.2 },
    },
  });
  assert.deepEqual(alertas.map(alerta => alerta.codigo), ['OUTBOX_ANTIGUO', 'TASA_ERROR_OUTBOX']);
  sqlite.close();
});

test('alerta cuando una cola acumula más pendientes que en la ventana anterior', async () => {
  const { sqlite, db } = baseCompleta();
  const estado = await consultarOperacionesMvp(
    new D1RepositorioOperacionesMvp(db), 20,
    () => new Date('2099-10-01T10:00:00.000Z')
  );
  const alertas = construirAlertasOperativas({
    ...estado,
    tendenciaColas: {
      outbox: {
        creadosPendientesUltimos15m: 7,
        creadosPendientes15mAnteriores: 2,
        crecimiento: 5,
      },
      comunicaciones: {
        creadosPendientesUltimos15m: 5,
        creadosPendientes15mAnteriores: 4,
        crecimiento: 1,
      },
    },
  });
  assert.deepEqual(alertas.map(alerta => alerta.codigo), [
    'CRECIMIENTO_COLA_OUTBOX', 'CRECIMIENTO_COLA_COMUNICACIONES',
  ]);
  sqlite.close();
});

test('el contrato operativo exige sesión y declara una respuesta sin PII', async () => {
  const { sqlite, db } = baseCompleta();
  sembrarFallas(sqlite);
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('viewer@test', 'x', 'viewer')");
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const token = await createSessionToken('viewer@test', secret, 'csrf-ops');
  const env = { DB: db, SESSION_SECRET: secret };
  const noAuth = await consultarEstado({
    request: new Request('https://test/api/v1/admin/integraciones/estado'), env,
  });
  assert.equal(noAuth.status, 401);
  const response = await consultarEstado({
    request: new Request('https://test/api/v1/admin/integraciones/estado', {
      headers: { Cookie: `pm_admin_session=${encodeURIComponent(token)}` },
    }), env,
  });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.contiene_pii, false);
  assert.equal(body.data.pagos.eventos[0].correlationId, 'request-ops-1');
  assert.equal('payload' in body.data.outbox.eventos[0], false);
  assert.doesNotMatch(JSON.stringify(body), /no-exponer@example|payment-secret|event-secret/);
  sqlite.close();
});

test('sólo super admin reprocesa una comunicación con motivo y auditoría', async () => {
  const { sqlite, db } = baseCompleta();
  sembrarFallas(sqlite);
  sqlite.exec(`INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
    ('viewer@test', 'x', 'viewer'), ('admin@test', 'x', 'super_admin')`);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-ops-reprocess';
  const viewer = await createSessionToken('viewer@test', secret, csrf);
  const admin = await createSessionToken('admin@test', secret, csrf);
  const intencionUid = String(sqlite.prepare('SELECT intencion_uid FROM comunicacion_intenciones LIMIT 1').get()?.intencion_uid);
  const request = (token: string) => new Request(
    'https://test/api/v1/admin/integraciones/comunicaciones/reprocesar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
        Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      },
      body: JSON.stringify({
        intencion_uid: intencionUid, motivo: 'Canal validado por operaciones',
      }),
    }
  );
  const prohibido = await reprocesarComunicacion({ request: request(viewer), env: { DB: db, SESSION_SECRET: secret } });
  assert.equal(prohibido.status, 403);
  const exitoso = await reprocesarComunicacion({ request: request(admin), env: { DB: db, SESSION_SECRET: secret } });
  assert.equal(exitoso.status, 200);
  assert.equal((await exitoso.json() as any).estado, 'pendiente');
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM auditoria_admin
    WHERE accion = 'reprocesar_intencion_comunicacion' AND motivo = 'Canal validado por operaciones'
  `).get()?.n, 1);
  sqlite.close();
});

test('sólo super admin libera retenciones vencidas manualmente y deja auditoría', async () => {
  const { sqlite, db } = baseCompleta();
  sembrarFallas(sqlite);
  sqlite.exec(`
    UPDATE retenciones_reserva SET expires_at = '2000-01-01T00:00:00.000Z';
    UPDATE reservas SET hold_expires_at = '2000-01-01T00:00:00.000Z';
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
      ('viewer@test', 'x', 'viewer'), ('admin@test', 'x', 'super_admin');
  `);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-ops-expire';
  const viewer = await createSessionToken('viewer@test', secret, csrf);
  const admin = await createSessionToken('admin@test', secret, csrf);
  const request = (token: string, csrfHeader = csrf) => new Request(
    'https://test/api/v1/admin/integraciones/retenciones/expirar', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfHeader,
        Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      },
    }
  );
  const sinCsrf = await expirarRetencionesAdmin({
    request: request(admin, ''), env: { DB: db, SESSION_SECRET: secret },
  });
  assert.equal(sinCsrf.status, 403);
  const prohibido = await expirarRetencionesAdmin({
    request: request(viewer), env: { DB: db, SESSION_SECRET: secret },
  });
  assert.equal(prohibido.status, 403);

  const exitoso = await expirarRetencionesAdmin({
    request: request(admin), env: { DB: db, SESSION_SECRET: secret },
  });
  assert.equal(exitoso.status, 200);
  assert.equal((await exitoso.json() as any).data.expiradas, 1);
  const reserva = sqlite.prepare(`
    SELECT estado, estado_flujo FROM reservas WHERE codigo = 'RES-OPS-1'
  `).get();
  assert.equal(reserva?.estado, 'cancelada');
  assert.equal(reserva?.estado_flujo, 'vencida');
  assert.equal(sqlite.prepare(`
    SELECT estado FROM retenciones_reserva LIMIT 1
  `).get()?.estado, 'vencida');
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM auditoria_admin
    WHERE accion = 'expirar_retenciones_manual'
      AND email = 'admin@test'
      AND metadata_json = '{"expiradas":1}'
  `).get()?.n, 1);

  const repetido = await expirarRetencionesAdmin({
    request: request(admin), env: { DB: db, SESSION_SECRET: secret },
  });
  assert.equal(repetido.status, 200);
  assert.equal((await repetido.json() as any).data.expiradas, 0);
  sqlite.close();
});

test('el panel ofrece liberar retenciones vencidas con confirmación explícita', () => {
  const source = readFileSync(new URL('../../src/PanelReservas.tsx', import.meta.url), 'utf8');
  assert.match(source, /Liberar retenciones vencidas/);
  assert.match(source, /window\.confirm/);
  assert.match(source, /\/api\/v1\/admin\/integraciones\/retenciones\/expirar/);
});
