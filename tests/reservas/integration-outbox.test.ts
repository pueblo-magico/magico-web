import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { despacharEventosIntegracion } from '../../functions/_application/reservas/despacharEventosIntegracion.ts';
import {
  consultarEstadoOutbox,
  reprocesarEventoOutbox,
} from '../../functions/_application/reservas/gestionarOutboxIntegracion.ts';
import {
  D1RepositorioDeduplicacionEventos,
  D1RepositorioOutboxIntegracion,
} from '../../functions/_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';
import {
  ErrorConfiguracionEntregaIntegracion,
  HttpEntregadorEventosIntegracion,
} from '../../functions/_infrastructure/integrations/HttpEntregadorEventosIntegracion.ts';
import { onRequestPost as despacharOutbox } from '../../functions/api/v1/integrations/outbox/dispatch.ts';
import { onRequestGet as consultarOutboxAdmin } from '../../functions/api/v1/admin/integraciones/outbox/index.ts';
import { onRequestPost as despacharOutboxAdmin } from '../../functions/api/v1/admin/integraciones/outbox/despachar.ts';
import { onRequestPost as reprocesarOutboxAdmin } from '../../functions/api/v1/admin/integraciones/outbox/reprocesar.ts';
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

function crearEvento(sqlite: DatabaseSync, eventoUid: string): void {
  const reservaId = Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA Outbox', 'pii-no-copiar@example.test', 1, '2099-10-10', '2099-10-12',
      2, 100, 'pendiente', 'QA') RETURNING id
  `).get()?.id);
  // La creación legacy también emite un evento válido. Este helper aísla el
  // evento explícito que cada escenario quiere despachar.
  sqlite.exec('DELETE FROM integration_outbox');
  sqlite.prepare(`
    INSERT INTO reserva_eventos (
      reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
      evento_uid, version, agregado_tipo, agregado_id
    ) VALUES (?, 'reserva.creada', 'sistema', 'qa', 'correlation-qa',
      json_object('email', 'pii-no-copiar@example.test'), ?, 1, 'reserva', ?)
  `).run(reservaId, eventoUid, String(reservaId));
}

test('crea el outbox en la misma escritura del evento sin copiar PII', () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:outbox-1');

  const row = sqlite.prepare(`
    SELECT event_id, event_type, payload_json, estado, attempts
    FROM integration_outbox WHERE event_id = 'reserva:outbox-1'
  `).get();
  assert.equal(row?.event_type, 'reserva.creada');
  assert.equal(row?.estado, 'pending');
  assert.equal(row?.attempts, 0);
  assert.equal(String(row?.payload_json).includes('pii-no-copiar@example.test'), false);
  assert.equal((JSON.parse(String(row?.payload_json)) as any).event_id, 'reserva:outbox-1');
  sqlite.close();
});

test('reintenta con backoff y entrega al menos una vez con event_id estable', async () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:outbox-retry');
  const repositorio = new D1RepositorioOutboxIntegracion(d1(sqlite));
  let llamadas = 0;
  const entregador = {
    async entregar(evento: { eventId: string }) {
      llamadas++;
      assert.equal(evento.eventId, 'reserva:outbox-retry');
      if (llamadas === 1) throw Object.assign(new Error('no persistir'), { codigo: 'N8N_TIMEOUT' });
    },
  };

  const primera = await despacharEventosIntegracion(repositorio, entregador, {
    consumer: 'n8n', ahora: () => new Date('2099-10-01T10:00:00.000Z'),
    aleatorio: () => 0, generarClaimUid: () => 'claim-1',
  });
  assert.deepEqual(primera, { reclamados: 1, entregados: 0, reprogramados: 1, deadLetter: 0 });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, next_attempt_at, last_error_code
    FROM integration_outbox WHERE event_id = 'reserva:outbox-retry'
  `).get() }, {
    estado: 'pending', attempts: 1,
    next_attempt_at: '2099-10-01T10:01:00.000Z', last_error_code: 'N8N_TIMEOUT',
  });

  const segunda = await despacharEventosIntegracion(repositorio, entregador, {
    consumer: 'n8n', ahora: () => new Date('2099-10-01T10:01:01.000Z'),
    aleatorio: () => 0, generarClaimUid: () => 'claim-2',
  });
  assert.deepEqual(segunda, { reclamados: 1, entregados: 1, reprogramados: 0, deadLetter: 0 });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, delivered_at, last_error_code
    FROM integration_outbox WHERE event_id = 'reserva:outbox-retry'
  `).get() }, {
    estado: 'delivered', attempts: 2,
    delivered_at: '2099-10-01T10:01:01.000Z', last_error_code: null,
  });
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM integration_outbox_attempts
    WHERE event_id = 'reserva:outbox-retry'
  `).get()?.n, 2);
  sqlite.close();
});

test('agota intentos en dead letter y permite deduplicar por consumidor', async () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:outbox-dlq');
  const database = d1(sqlite);
  const resultado = await despacharEventosIntegracion(
    new D1RepositorioOutboxIntegracion(database),
    { async entregar() { throw new Error('detalle externo no persistido'); } },
    {
      consumer: 'manychat', maxIntentos: 1,
      ahora: () => new Date('2099-10-01T11:00:00.000Z'),
      generarClaimUid: () => 'claim-dlq',
    }
  );
  assert.deepEqual(resultado, { reclamados: 1, entregados: 0, reprogramados: 0, deadLetter: 1 });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, last_error_code
    FROM integration_outbox WHERE event_id = 'reserva:outbox-dlq'
  `).get() }, {
    estado: 'dead_letter', attempts: 1, last_error_code: 'INTEGRATION_DELIVERY_ERROR',
  });

  const deduplicacion = new D1RepositorioDeduplicacionEventos(database);
  assert.equal(await deduplicacion.registrarProcesado('manychat', 'reserva:outbox-dlq'), true);
  assert.equal(await deduplicacion.registrarProcesado('manychat', 'reserva:outbox-dlq'), false);
  assert.equal(await deduplicacion.registrarProcesado('n8n', 'reserva:outbox-dlq'), true);
  sqlite.close();
});

test('observa latencia y permite recuperación auditada sólo de dead letter', async () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:outbox-operacion');
  const database = d1(sqlite);
  const repositorio = new D1RepositorioOutboxIntegracion(database);
  await despacharEventosIntegracion(
    repositorio,
    { async entregar() { throw Object.assign(new Error('externo'), { codigo: 'N8N_TIMEOUT' }); } },
    {
      consumer: 'n8n', maxIntentos: 1,
      ahora: () => new Date('2099-10-01T12:00:00.000Z'),
      generarClaimUid: () => 'claim-operacion',
    }
  );

  const estado = await consultarEstadoOutbox(
    repositorio, 20, () => new Date('2099-10-01T12:05:00.000Z')
  );
  assert.equal(estado.resumen.dead_letter, 1);
  assert.deepEqual(estado.deliveryLast24h, { attempts: 1, failures: 1, failureRate: 1 });
  assert.equal(estado.eventos[0]?.eventId, 'reserva:outbox-operacion');
  assert.equal(estado.eventos[0]?.attempts, 1);
  assert.equal(estado.eventos[0]?.lastErrorCode, 'N8N_TIMEOUT');
  assert.equal(estado.eventos[0]?.deliveryLatencySeconds, null);

  assert.equal(await reprocesarEventoOutbox({
    eventId: 'reserva:outbox-operacion', motivo: 'Recuperación aprobada por operaciones',
    actorEmail: 'admin@test', correlationId: 'req-reprocess-1',
  }, repositorio, () => new Date('2099-10-01T12:06:00.000Z')), true);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, next_attempt_at, last_error_code
    FROM integration_outbox WHERE event_id = 'reserva:outbox-operacion'
  `).get() }, {
    estado: 'pending', attempts: 0,
    next_attempt_at: '2099-10-01T12:06:00.000Z', last_error_code: null,
  });
  const auditoria = sqlite.prepare(`
    SELECT email, accion, motivo, entidad_id, metadata_json FROM auditoria_admin
    WHERE accion = 'reprocesar_evento_outbox'
  `).get() as Record<string, unknown>;
  assert.equal(auditoria.email, 'admin@test');
  assert.equal(auditoria.motivo, 'Recuperación aprobada por operaciones');
  assert.equal(auditoria.entidad_id, 'reserva:outbox-operacion');
  assert.deepEqual(JSON.parse(String(auditoria.metadata_json)), {
    intentos_anteriores: 1, error_anterior: 'N8N_TIMEOUT',
  });
  assert.equal(await reprocesarEventoOutbox({
    eventId: 'reserva:outbox-operacion', motivo: 'Segundo intento no permitido',
    actorEmail: 'admin@test', correlationId: 'req-reprocess-2',
  }, repositorio), false);
  sqlite.close();
});

test('el contrato admin permite observar y reserva el reproceso al super admin', async () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:outbox-admin');
  sqlite.exec(`
    UPDATE integration_outbox SET estado = 'dead_letter', attempts = 8,
      last_error_code = 'N8N_TIMEOUT' WHERE event_id = 'reserva:outbox-admin';
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
      ('admin@test', 'x', 'super_admin'), ('viewer@test', 'x', 'viewer');
  `);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-outbox-admin';
  const tokenAdmin = await createSessionToken('admin@test', secret, csrf);
  const tokenViewer = await createSessionToken('viewer@test', secret, csrf);
  const cookie = (token: string) => `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const env = {
    DB: d1(sqlite), SESSION_SECRET: secret,
    INTEGRATION_OUTBOX_ENABLED: 'true',
    INTEGRATION_EVENTS_WEBHOOK_URL: 'https://n8n.example.test/webhook/reservas',
    INTEGRATION_EVENTS_WEBHOOK_SECRET: 'webhook-secret-seguro-123456789',
  };

  const lectura = await consultarOutboxAdmin({
    request: new Request('https://test/api/v1/admin/integraciones/outbox', {
      headers: { Cookie: cookie(tokenViewer) },
    }), env,
  });
  assert.equal(lectura.status, 200);
  const lecturaBody = await lectura.json() as any;
  assert.equal(lecturaBody.meta.contiene_pii, false);
  assert.equal(lecturaBody.meta.despacho_habilitado, true);
  assert.equal(lecturaBody.meta.destino_configurado, true);
  assert.equal(lecturaBody.data.eventos[0].eventId, 'reserva:outbox-admin');
  assert.equal('payload' in lecturaBody.data.eventos[0], false);

  const requestReproceso = (token: string) => new Request(
    'https://test/api/v1/admin/integraciones/outbox/reprocesar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrf,
        Cookie: cookie(token),
      },
      body: JSON.stringify({
        event_id: 'reserva:outbox-admin', motivo: 'Recuperación manual autorizada',
      }),
    }
  );
  const prohibido = await reprocesarOutboxAdmin({ request: requestReproceso(tokenViewer), env });
  assert.equal(prohibido.status, 403);
  const exitoso = await reprocesarOutboxAdmin({ request: requestReproceso(tokenAdmin), env });
  assert.equal(exitoso.status, 200);
  assert.equal((await exitoso.json() as any).estado, 'pending');

  const requestDespacho = (token: string) => new Request(
    'https://test/api/v1/admin/integraciones/outbox/despachar', {
      method: 'POST', headers: { 'X-CSRF-Token': csrf, Cookie: cookie(token) },
    }
  );
  const despachoProhibido = await despacharOutboxAdmin({
    request: requestDespacho(tokenViewer), env,
  });
  assert.equal(despachoProhibido.status, 403);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });
  try {
    const despacho = await despacharOutboxAdmin({ request: requestDespacho(tokenAdmin), env });
    assert.equal(despacho.status, 200);
    assert.deepEqual((await despacho.json() as any).data, {
      reclamados: 1, entregados: 1, reprogramados: 0, deadLetter: 0,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  sqlite.close();
});

test('el adaptador HTTP envía un envelope mínimo con idempotencia y secreto server-side', async () => {
  let request: { input: RequestInfo | URL; init?: RequestInit } | null = null;
  const entregador = new HttpEntregadorEventosIntegracion({
    url: 'https://n8n.example.test/webhook/reservas',
    secret: 'webhook-secret-seguro-123456789',
  }, async (input, init) => {
    request = { input, init };
    return new Response(null, { status: 204 });
  });
  await entregador.entregar({
    eventId: 'reserva:http-1', eventType: 'reserva.creada', schemaVersion: 1,
    aggregateType: 'reserva', aggregateId: '7',
    payload: { event_id: 'reserva:http-1', reservation_id: 7 },
    estado: 'processing', attempts: 1,
    occurredAt: '2099-10-01T10:00:00.000Z', createdAt: '2099-10-01T10:00:00.000Z',
  });
  assert.equal(String(request?.input), 'https://n8n.example.test/webhook/reservas');
  const headers = new Headers(request?.init?.headers);
  assert.equal(headers.get('Authorization'), 'Bearer webhook-secret-seguro-123456789');
  assert.equal(headers.get('Idempotency-Key'), 'reserva:http-1');
  assert.deepEqual(JSON.parse(String(request?.init?.body)), {
    event_id: 'reserva:http-1', reservation_id: 7,
  });
  assert.throws(
    () => new HttpEntregadorEventosIntegracion({ url: 'http://inseguro.test', secret: 'x'.repeat(24) }),
    ErrorConfiguracionEntregaIntegracion
  );
});

test('el dispatcher HTTP falla cerrado y despacha sólo con identidad exclusiva', async () => {
  const sqlite = baseCompleta();
  crearEvento(sqlite, 'reserva:http-dispatch');
  const secret = 'outbox-secret-seguro-123456789';
  const env = {
    DB: d1(sqlite), OUTBOX_DISPATCH_SECRET: secret,
    INTEGRATION_OUTBOX_ENABLED: 'true',
    INTEGRATION_EVENTS_WEBHOOK_URL: 'https://n8n.example.test/webhook/reservas',
    INTEGRATION_EVENTS_WEBHOOK_SECRET: 'webhook-secret-seguro-123456789',
  };
  const sinAuth = await despacharOutbox({
    request: new Request('https://test/api/v1/integrations/outbox/dispatch', { method: 'POST' }), env,
  });
  assert.equal(sinAuth.status, 401);

  const originalFetch = globalThis.fetch;
  let entregas = 0;
  globalThis.fetch = async () => { entregas++; return new Response(null, { status: 204 }); };
  try {
    const response = await despacharOutbox({
      request: new Request('https://test/api/v1/integrations/outbox/dispatch', {
        method: 'POST', headers: { 'X-Service-Secret': secret },
      }), env,
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true, reclamados: 1, entregados: 1, reprogramados: 0, deadLetter: 0,
    });
    assert.equal(entregas, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
  sqlite.close();
});
