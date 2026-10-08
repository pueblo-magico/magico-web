import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { despacharIntencionesComunicacion } from '../../functions/_application/reservas/despacharIntencionesComunicacion.ts';
import {
  consultarEstadoComunicaciones,
  reprocesarIntencionComunicacion,
} from '../../functions/_application/reservas/gestionarIntencionesComunicacion.ts';
import { D1RepositorioIntencionesComunicacion } from '../../functions/_infrastructure/d1/D1RepositorioIntencionesComunicacion.ts';

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
  class Statement {
    private values: SQLInputValue[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
    bind(...bindings: unknown[]) { this.values = bindings as SQLInputValue[]; return this; }
    async first() {
      return sqlite.prepare(this.query).get(...this.values) as Record<string, unknown> | undefined || null;
    }
    async all() {
      return { results: sqlite.prepare(this.query).all(...this.values) as Record<string, unknown>[] };
    }
    async run() { return sqlite.prepare(this.query).run(...this.values); }
  }
  return {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        for (const statement of statements) {
          results.push(/\bRETURNING\b/i.test(statement.query)
            ? await statement.all()
            : await statement.run());
        }
        sqlite.exec('COMMIT');
        return results;
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
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen, codigo
    ) VALUES ('QA Comunicación', 'pii-no-copiar@example.test', 1,
      '2099-10-10', '2099-10-12', 2, 100, 'pendiente', 'web', 'RES-COM-1')
    RETURNING id
  `).get()?.id);
}

function crearEvento(
  sqlite: DatabaseSync,
  reservaId: number,
  tipo: string,
  uid: string
): void {
  sqlite.prepare(`
    INSERT INTO reserva_eventos (
      reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
      evento_uid, version, agregado_tipo, agregado_id
    ) VALUES (?, ?, 'sistema', 'qa', 'correlation-comunicacion', '{}', ?, 1, 'reserva', ?)
  `).run(reservaId, tipo, uid, String(reservaId));
}

test('proyecta eventos de reserva a intenciones versionadas sin copiar PII', () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  const eventos = [
    ['reserva.creada', 'reserva_creada'],
    ['reserva.retencion_iniciada', 'pago_pendiente'],
    ['pago.aprobado', 'pago_aprobado'],
    ['reserva.retencion_vencida', 'reserva_vencida'],
    ['reserva.modificada_admin', 'reserva_modificada'],
    ['reserva.cancelada', 'reserva_cancelada'],
  ] as const;
  eventos.forEach(([tipo], index) => crearEvento(sqlite, reservaId, tipo, `com-source-${index}`));

  const intenciones = sqlite.prepare(`
    SELECT tipo, idioma, plantilla_codigo, plantilla_version, estado
    FROM comunicacion_intenciones ORDER BY id
  `).all() as Record<string, unknown>[];
  assert.deepEqual(intenciones.map(row => row.tipo), eventos.map(([, intencion]) => intencion));
  assert.equal(intenciones.every(row =>
    row.idioma === 'es' && row.plantilla_version === 1 && row.estado === 'pendiente'
  ), true);

  const envelopes = sqlite.prepare(`
    SELECT payload_json FROM integration_outbox
    WHERE event_type = 'comunicacion.intencion_creada'
  `).all() as Array<{ payload_json: string }>;
  assert.equal(envelopes.length, 6);
  assert.doesNotMatch(JSON.stringify(envelopes), /pii-no-copiar|QA Comunicación/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM comunicacion_plantillas').get()?.n, 12);
  sqlite.prepare("UPDATE reservas SET idioma_comunicacion = 'en' WHERE id = ?").run(reservaId);
  crearEvento(sqlite, reservaId, 'reserva.creada', 'com-source-en');
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT idioma, plantilla_codigo, plantilla_version
    FROM comunicacion_intenciones WHERE source_event_uid = 'com-source-en'
  `).get() }, { idioma: 'en', plantilla_codigo: 'reserva_creada', plantilla_version: 1 });
  assert.throws(
    () => sqlite.prepare("UPDATE comunicacion_plantillas SET cuerpo_template = 'cambio' WHERE id = 1").run(),
    /publicada es inmutable/
  );
  sqlite.prepare(`
    UPDATE comunicacion_plantillas SET estado = 'retirada'
    WHERE codigo = 'reserva_creada' AND idioma = 'es' AND version = 1
  `).run();
  sqlite.prepare(`
    INSERT INTO comunicacion_plantillas (
      codigo, intencion, idioma, version, estado, asunto_template, cuerpo_template, published_at
    ) VALUES ('reserva_creada', 'reserva_creada', 'es', 2, 'publicada',
      'Reserva {{reserva_codigo}} recibida', 'Recibimos tu solicitud.',
      '2099-10-01T00:00:00.000Z')
  `).run();
  assert.equal(sqlite.prepare(`
    SELECT version FROM comunicacion_plantillas
    WHERE intencion = 'reserva_creada' AND idioma = 'es' AND estado = 'publicada'
  `).get()?.version, 2);

  sqlite.prepare(`
    INSERT OR IGNORE INTO reserva_eventos (
      reserva_id, tipo, actor_tipo, evento_uid, version, agregado_tipo, agregado_id
    ) VALUES (?, 'reserva.creada', 'sistema', 'com-source-en', 1, 'reserva', ?)
  `).run(reservaId, String(reservaId));
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM comunicacion_intenciones WHERE source_event_uid = 'com-source-en'
  `).get()?.n, 1);
  sqlite.close();
});

test('sin adaptador conserva la intención recuperable y no afecta la reserva', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  crearEvento(sqlite, reservaId, 'reserva.creada', 'com-sin-canal');
  const repositorio = new D1RepositorioIntencionesComunicacion(d1(sqlite));

  const resultado = await despacharIntencionesComunicacion(repositorio, null, {
    ahora: () => new Date('2099-10-01T10:00:00.000Z'),
    generarClaimUid: () => 'claim-sin-canal',
  });

  assert.deepEqual(resultado, {
    reclamadas: 1, entregadas: 0, sinCanal: 1, reprogramadas: 0, deadLetter: 0,
  });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, last_error_code FROM comunicacion_intenciones
  `).get() }, {
    estado: 'sin_canal', attempts: 1, last_error_code: 'COMMUNICATION_CHANNEL_DISABLED',
  });
  assert.equal(sqlite.prepare('SELECT estado FROM reservas WHERE id = ?').get(reservaId)?.estado, 'pendiente');
  const estado = await consultarEstadoComunicaciones(
    repositorio, 100, () => new Date('2099-10-01T10:01:00.000Z')
  );
  assert.equal(estado.resumen.sin_canal, 1);
  assert.equal(estado.intenciones[0].lastErrorCode, 'COMMUNICATION_CHANNEL_DISABLED');
  assert.equal(await reprocesarIntencionComunicacion({
    intencionUid: 'comunicacion:com-sin-canal',
    actorEmail: 'admin@pueblomagico.local',
    motivo: 'Se habilitó el canal de entrega.',
    correlationId: 'qa-reproceso-sin-canal',
  }, repositorio, () => new Date('2099-10-01T10:01:00.000Z')), true);
  assert.equal(sqlite.prepare('SELECT estado FROM comunicacion_intenciones').get()?.estado, 'pendiente');
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT email, accion, motivo, correlation_id FROM auditoria_admin
    WHERE accion = 'reprocesar_intencion_comunicacion'
  `).get() }, {
    email: 'admin@pueblomagico.local',
    accion: 'reprocesar_intencion_comunicacion',
    motivo: 'Se habilitó el canal de entrega.',
    correlation_id: 'qa-reproceso-sin-canal',
  });
  sqlite.close();
});

test('reintenta errores seguros, agota en dead letter y permite recuperación', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  crearEvento(sqlite, reservaId, 'pago.aprobado', 'com-retry');
  const repositorio = new D1RepositorioIntencionesComunicacion(d1(sqlite));
  const canal = {
    codigo: 'email',
    async entregar() { throw { codigo: 'SMTP_TIMEOUT', detalle: 'pii@example.test' }; },
  };

  const primero = await despacharIntencionesComunicacion(repositorio, canal, {
    maxIntentos: 2,
    ahora: () => new Date('2099-10-01T10:00:00.000Z'),
    aleatorio: () => 0,
    generarClaimUid: () => 'claim-retry-1',
  });
  assert.equal(primero.reprogramadas, 1);

  const segundo = await despacharIntencionesComunicacion(repositorio, canal, {
    maxIntentos: 2,
    ahora: () => new Date('2099-10-01T10:01:00.000Z'),
    aleatorio: () => 0,
    generarClaimUid: () => 'claim-retry-2',
  });
  assert.equal(segundo.deadLetter, 1);
  const row = sqlite.prepare(`
    SELECT estado, attempts, last_error_code FROM comunicacion_intenciones
  `).get();
  assert.deepEqual({ ...row }, { estado: 'dead_letter', attempts: 2, last_error_code: 'SMTP_TIMEOUT' });
  assert.doesNotMatch(JSON.stringify(row), /pii@example/);
  assert.equal(await reprocesarIntencionComunicacion({
    intencionUid: 'comunicacion:com-retry',
    actorEmail: 'admin@pueblomagico.local',
    motivo: 'Se corrigió el canal de correo.',
    correlationId: 'qa-reproceso-dead-letter',
  }, repositorio, () => new Date('2099-10-01T10:02:00.000Z')), true);
  sqlite.close();
});

test('un lease evita que dos despachos entreguen la misma intención', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  crearEvento(sqlite, reservaId, 'reserva.creada', 'com-concurrente');
  const repositorio = new D1RepositorioIntencionesComunicacion(d1(sqlite));
  const ahora = '2099-10-01T10:00:00.000Z';
  const primera = await repositorio.reclamarLote({
    claimUid: 'claim-a', limite: 25, ahora,
    claimExpiresAt: '2099-10-01T10:05:00.000Z',
  });
  const segunda = await repositorio.reclamarLote({
    claimUid: 'claim-b', limite: 25, ahora,
    claimExpiresAt: '2099-10-01T10:05:00.000Z',
  });
  assert.equal(primera.length, 1);
  assert.equal(segunda.length, 0);
  await repositorio.marcarEntregada({
    intencionUid: primera[0].intencionUid,
    claimUid: 'claim-a', canal: 'email', completedAt: '2099-10-01T10:00:01.000Z',
  });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM comunicacion_intentos').get()?.n, 1);
  assert.equal(sqlite.prepare('SELECT estado FROM comunicacion_intenciones').get()?.estado, 'entregada');
  sqlite.close();
});
