import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { despacharIntencionesComunicacion } from '../../functions/_application/reservas/despacharIntencionesComunicacion.ts';
import {
  consultarEstadoComunicaciones,
  reprocesarIntencionComunicacion,
} from '../../functions/_application/reservas/gestionarIntencionesComunicacion.ts';
import {
  reclamarNotificacionReserva,
  registrarResultadoNotificacionReserva,
  type NotificacionReservaReclamada,
  type RepositorioNotificacionesReserva,
} from '../../functions/_application/reservas/gestionarNotificacionesReserva.ts';
import {
  codigoErrorComunicacionSeguro,
  proximoIntentoComunicacion,
} from '../../functions/_domain/reservas/communicationIntents.ts';
import { D1RepositorioIntencionesComunicacion } from '../../functions/_infrastructure/d1/D1RepositorioIntencionesComunicacion.ts';
import { onRequestPost as entregarNotificacionReserva } from '../../functions/api/v1/integrations/comunicaciones/notificaciones.ts';

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

function notificacionReclamada(
  cambios: Partial<NotificacionReservaReclamada> = {}
): NotificacionReservaReclamada {
  return {
    intencionUid: 'comunicacion:test-email',
    reservaId: 1,
    tipo: 'reserva_creada',
    idioma: 'es',
    attempts: 1,
    email: 'huesped@example.test',
    codigo: 'RES-EMAIL-1',
    estadoFlujo: 'pendiente',
    fechaCheckin: '2099-10-10',
    fechaCheckout: '2099-10-12',
    cantidadPersonas: 2,
    montoSenaCentavos: 3000000,
    moneda: 'ARS',
    expiresAt: null,
    checkoutUrl: null,
    asuntoTemplate: 'Reserva {{reserva_codigo}}',
    cuerpoTemplate: '{{status_url}} | {{payment_url}} | {{monto_sena}} | {{desconocida}}',
    ...cambios,
  };
}

function repositorioNotificacionesFalso(
  reclamada: NotificacionReservaReclamada | null
): RepositorioNotificacionesReserva & {
  finalizaciones: Array<Parameters<RepositorioNotificacionesReserva['finalizarEntrega']>[0]>;
} {
  const finalizaciones: Array<Parameters<RepositorioNotificacionesReserva['finalizarEntrega']>[0]> = [];
  return {
    finalizaciones,
    async reclamarPorUid() { return reclamada; },
    async finalizarEntrega(entrada) {
      finalizaciones.push(entrada);
      return true;
    },
  };
}

test('valida reclamos y construye enlaces para cada estado de la reserva', async () => {
  const repositorio = repositorioNotificacionesFalso(null);
  const invocar = (intencionUid: string, publicSiteUrl: string) => reclamarNotificacionReserva(
    { intencionUid, publicSiteUrl },
    repositorio,
    () => new Date('2099-10-01T10:00:00.000Z'),
    () => 'claim-email'
  );

  await assert.rejects(() => invocar('', 'https://preview.test'),
    (error: any) => error.codigo === 'DATOS_INVALIDOS' && error.status === 400);
  await assert.rejects(() => invocar('x'.repeat(201), 'https://preview.test'),
    (error: any) => error.codigo === 'DATOS_INVALIDOS');
  await assert.rejects(() => invocar('comunicacion:test', 'no-es-url'),
    (error: any) => error.codigo === 'DATOS_INVALIDOS');
  await assert.rejects(() => invocar('comunicacion:test', 'ftp://preview.test'),
    (error: any) => error.codigo === 'DATOS_INVALIDOS');
  assert.equal(await invocar(' comunicacion:test ', 'https://preview.test'), null);

  const casos = [
    [
      notificacionReclamada({ tipo: 'pago_aprobado', idioma: 'en', moneda: 'MONEDA_INVALIDA' }),
      '/reserva-confirmada?reserva=RES-EMAIL-1',
    ],
    [
      notificacionReclamada({
        tipo: 'reserva_vencida',
        checkoutUrl: 'https://pagos.example.test/checkout/1',
      }),
      '/reserva-fallida?reserva=RES-EMAIL-1',
    ],
    [
      notificacionReclamada({ estadoFlujo: 'confirmada' }),
      '/reserva-confirmada?reserva=RES-EMAIL-1',
    ],
  ] as const;

  for (const [reclamada, rutaEsperada] of casos) {
    const repoCaso = repositorioNotificacionesFalso(reclamada);
    const entrega = await reclamarNotificacionReserva(
      { intencionUid: reclamada.intencionUid, publicSiteUrl: 'https://preview.test/base/' },
      repoCaso,
      () => new Date('2099-10-01T10:00:00.000Z'),
      () => 'claim-email'
    );
    assert.equal(entrega?.estado, 'lista');
    assert.match((entrega as any).cuerpo, new RegExp(rutaEsperada.replace(/[?]/g, '\\?')));
    assert.doesNotMatch((entrega as any).cuerpo, /\{\{desconocida\}\}/);
  }
});

test('normaliza resultados de entrega, errores y reintentos', async () => {
  const repositorio = repositorioNotificacionesFalso(null);
  const ahora = () => new Date('2099-10-01T10:00:00.000Z');
  const base = {
    intencionUid: 'comunicacion:test-email',
    claimUid: 'claim-email',
    deliveryUid: 'entrega:test-email:1',
  };

  for (const entrada of [
    { ...base, intencionUid: '' },
    { ...base, claimUid: '' },
    { ...base, deliveryUid: '' },
  ]) {
    await assert.rejects(
      () => registrarResultadoNotificacionReserva({ ...entrada, resultado: 'entregada' }, repositorio, ahora),
      (error: any) => error.codigo === 'DATOS_INVALIDOS' && error.status === 400
    );
  }

  assert.equal(await registrarResultadoNotificacionReserva({
    ...base, resultado: 'entregada', errorCode: 'IGNORADO',
  }, repositorio, ahora), true);
  assert.equal(await registrarResultadoNotificacionReserva({
    ...base, resultado: 'retry', errorCode: 'smtp-no-seguro@example.test',
  }, repositorio, ahora), true);
  assert.equal(await registrarResultadoNotificacionReserva({
    ...base, resultado: 'dead_letter', errorCode: 'SMTP_REJECTED',
  }, repositorio, ahora), true);

  assert.deepEqual(repositorio.finalizaciones.map(finalizacion => ({
    resultado: finalizacion.resultado,
    errorCode: finalizacion.errorCode,
    nextAttemptAt: finalizacion.nextAttemptAt,
  })), [
    { resultado: 'entregada', errorCode: null, nextAttemptAt: null },
    {
      resultado: 'retry',
      errorCode: 'EMAIL_DELIVERY_ERROR',
      nextAttemptAt: '2099-10-01T10:05:00.000Z',
    },
    { resultado: 'dead_letter', errorCode: 'SMTP_REJECTED', nextAttemptAt: null },
  ]);
});

test('normaliza errores y backoff sin exponer detalles del proveedor', () => {
  assert.equal(codigoErrorComunicacionSeguro({ codigo: 'SMTP_TIMEOUT' }), 'SMTP_TIMEOUT');
  assert.equal(
    codigoErrorComunicacionSeguro(new Error('guest@example.test')),
    'COMMUNICATION_DELIVERY_ERROR'
  );
  assert.equal(
    codigoErrorComunicacionSeguro({ codigo: 'valor-inválido@example.test' }),
    'COMMUNICATION_DELIVERY_ERROR'
  );
  assert.equal(
    proximoIntentoComunicacion(0, new Date('2099-10-01T10:00:00.000Z'), () => -1),
    '2099-10-01T10:01:00.000Z'
  );
  assert.equal(
    proximoIntentoComunicacion(20, new Date('2099-10-01T10:00:00.000Z'), () => 2),
    '2099-10-01T11:12:00.000Z'
  );
});

test('valida el reproceso y representa una cola vacía sin inventar fallas', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioIntencionesComunicacion(d1(sqlite));
  const estado = await consultarEstadoComunicaciones(
    repositorio, 0, () => new Date('2099-10-01T10:00:00.000Z')
  );
  assert.equal(estado.oldestPendingAgeSeconds, null);
  assert.deepEqual(estado.deliveryLast24h, { attempts: 0, failures: 0, failureRate: 0 });
  assert.equal(estado.intenciones.length, 0);
  await assert.rejects(
    () => reprocesarIntencionComunicacion({
      intencionUid: '', actorEmail: 'admin@test', motivo: 'Motivo válido', correlationId: 'qa-invalid',
    }, repositorio),
    (error: any) => error.codigo === 'DATOS_INVALIDOS' && error.status === 400
  );
  await assert.rejects(
    () => reprocesarIntencionComunicacion({
      intencionUid: 'comunicacion:ausente', actorEmail: 'admin@test', motivo: 'corto',
      correlationId: 'qa-invalid-reason',
    }, repositorio),
    (error: any) => error.codigo === 'DATOS_INVALIDOS'
  );
  assert.equal(await reprocesarIntencionComunicacion({
    intencionUid: 'comunicacion:ausente', actorEmail: 'admin@test',
    motivo: 'Reproceso válido para intención ausente', correlationId: 'qa-absent',
  }, repositorio), false);
  sqlite.close();
});

test('proyecta eventos de reserva a intenciones versionadas sin copiar PII', () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  const eventos = [
    ['reserva.creada_admin', 'reserva_creada'],
    ['reserva.retencion_iniciada', 'pago_pendiente'],
    ['reserva.confirmada', 'pago_aprobado'],
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
    row.idioma === 'es' && row.plantilla_version === 2 && row.estado === 'pendiente'
  ), true);

  const envelopes = sqlite.prepare(`
    SELECT payload_json FROM integration_outbox
    WHERE event_type = 'comunicacion.intencion_creada'
  `).all() as Array<{ payload_json: string }>;
  assert.equal(envelopes.length, 6);
  assert.doesNotMatch(JSON.stringify(envelopes), /pii-no-copiar|QA Comunicación/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM comunicacion_plantillas').get()?.n, 24);
  crearEvento(sqlite, reservaId, 'pago.aprobado', 'payment-source-without-confirmation');
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM comunicacion_intenciones
    WHERE source_event_uid = 'payment-source-without-confirmation'
  `).get()?.n, 0);
  sqlite.prepare("UPDATE reservas SET idioma_comunicacion = 'en' WHERE id = ?").run(reservaId);
  crearEvento(sqlite, reservaId, 'reserva.creada_admin', 'com-source-en');
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT idioma, plantilla_codigo, plantilla_version
    FROM comunicacion_intenciones WHERE source_event_uid = 'com-source-en'
  `).get() }, { idioma: 'en', plantilla_codigo: 'reserva_creada', plantilla_version: 2 });
  assert.throws(
    () => sqlite.prepare(`
      UPDATE comunicacion_plantillas SET cuerpo_template = 'cambio'
      WHERE codigo = 'reserva_creada' AND idioma = 'es' AND version = 2
    `).run(),
    /publicada es inmutable/
  );
  sqlite.prepare(`
    UPDATE comunicacion_plantillas SET estado = 'retirada'
    WHERE codigo = 'reserva_creada' AND idioma = 'es' AND version = 2
  `).run();
  sqlite.prepare(`
    INSERT INTO comunicacion_plantillas (
      codigo, intencion, idioma, version, estado, asunto_template, cuerpo_template, published_at
    ) VALUES ('reserva_creada', 'reserva_creada', 'es', 3, 'publicada',
      'Reserva {{reserva_codigo}} recibida', 'Recibimos tu solicitud.',
      '2099-10-01T00:00:00.000Z')
  `).run();
  assert.equal(sqlite.prepare(`
    SELECT version FROM comunicacion_plantillas
    WHERE intencion = 'reserva_creada' AND idioma = 'es' AND estado = 'publicada'
  `).get()?.version, 3);

  sqlite.prepare(`
    INSERT OR IGNORE INTO reserva_eventos (
      reserva_id, tipo, actor_tipo, evento_uid, version, agregado_tipo, agregado_id
    ) VALUES (?, 'reserva.creada_admin', 'sistema', 'com-source-en', 1, 'reserva', ?)
  `).run(reservaId, String(reservaId));
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM comunicacion_intenciones WHERE source_event_uid = 'com-source-en'
  `).get()?.n, 1);
  sqlite.close();
});

test('sin adaptador conserva la intención recuperable y no afecta la reserva', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  crearEvento(sqlite, reservaId, 'reserva.creada_admin', 'com-sin-canal');
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
  crearEvento(sqlite, reservaId, 'reserva.confirmada', 'com-retry');
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
  crearEvento(sqlite, reservaId, 'reserva.creada_admin', 'com-concurrente');
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

test('entrega por email el estado pendiente con datos y enlace recuperable', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  sqlite.prepare(`
    UPDATE reservas
    SET monto_sena = 30000, monto_sena_centavos = 3000000,
        hold_expires_at = '2099-10-01T10:15:00.000Z'
    WHERE id = ?
  `).run(reservaId);
  crearEvento(sqlite, reservaId, 'reserva.retencion_iniciada', 'com-email-pending');
  const env = {
    DB: d1(sqlite),
    N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-al-menos-32-caracteres',
    RESERVAS_PUBLIC_SITE_URL: 'https://preview.pueblomagico.test',
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-Integration-Id': 'n8n',
    'X-Service-Secret': env.N8N_INBOUND_SECRET,
  };
  const invocar = (body: unknown) => entregarNotificacionReserva({
    request: new Request('https://api.test/api/v1/integrations/comunicaciones/notificaciones', {
      method: 'POST', headers, body: JSON.stringify(body),
    }),
    env,
  });

  const claim = await invocar({
    accion: 'reclamar',
    intencion_uid: 'comunicacion:com-email-pending',
  });
  assert.equal(claim.status, 200, await claim.clone().text());
  const entrega: any = (await claim.json()).data;
  assert.equal(entrega.canal, 'email');
  assert.equal(entrega.estado, 'lista');
  assert.equal(entrega.destinatario, 'pii-no-copiar@example.test');
  assert.match(entrega.asunto, /RES-COM-1/);
  assert.match(entrega.cuerpo, /2099-10-10/);
  assert.match(entrega.cuerpo, /\$\s?30[.,]000|30\.000/);
  assert.match(entrega.cuerpo, /https:\/\/preview\.pueblomagico\.test\/reserva-pendiente\?reserva=RES-COM-1/);
  assert.doesNotMatch(entrega.cuerpo, /\{\{/);

  const resultado = {
    accion: 'resultado',
    intencion_uid: entrega.intencion_uid,
    claim_uid: entrega.claim_uid,
    delivery_uid: entrega.delivery_uid,
    resultado: 'entregada',
  };
  assert.equal((await invocar(resultado)).status, 200);
  assert.equal((await invocar(resultado)).status, 200);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, canal, last_error_code FROM comunicacion_intenciones
  `).get() }, { estado: 'entregada', canal: 'email', last_error_code: null });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM comunicacion_intentos').get()?.n, 1);
  sqlite.close();
});

test('una reserva sin email queda visible como sin canal y no se reintenta', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite);
  sqlite.prepare('UPDATE reservas SET cliente_email = NULL WHERE id = ?').run(reservaId);
  crearEvento(sqlite, reservaId, 'reserva.confirmada', 'com-email-missing');
  const env = {
    DB: d1(sqlite),
    N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-al-menos-32-caracteres',
  };
  const response = await entregarNotificacionReserva({
    request: new Request('https://preview.test/api/v1/integrations/comunicaciones/notificaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Id': 'n8n',
        'X-Service-Secret': env.N8N_INBOUND_SECRET,
      },
      body: JSON.stringify({
        accion: 'reclamar', intencion_uid: 'comunicacion:com-email-missing',
      }),
    }),
    env,
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json() as any).data, {
    intencion_uid: 'comunicacion:com-email-missing',
    estado: 'sin_canal',
    canal: 'email',
  });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, attempts, canal, last_error_code FROM comunicacion_intenciones
  `).get() }, {
    estado: 'sin_canal', attempts: 1, canal: 'email',
    last_error_code: 'EMAIL_DESTINATION_MISSING',
  });
  sqlite.close();
});
