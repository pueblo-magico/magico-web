import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { despacharEventosIntegracion } from '../../functions/_application/reservas/despacharEventosIntegracion.ts';
import {
  D1RepositorioDeduplicacionEventos,
  D1RepositorioOutboxIntegracion,
} from '../../functions/_infrastructure/d1/D1RepositorioOutboxIntegracion.ts';

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
