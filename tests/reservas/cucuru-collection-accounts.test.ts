import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { provisionarCuentaCobroReserva } from '../../functions/_application/reservas/provisionarCuentaCobro.ts';
import { ejecutarBackfillCucuru } from '../../functions/_application/reservas/ejecutarBackfillCucuru.ts';
import { procesarCollectionCucuru } from '../../functions/_application/reservas/procesarCollectionCucuru.ts';
import {
  aliasCuentaCobro,
  ErrorProvisionamientoDesconocido,
  cucuruHabilitado,
  customerIdCuentaCobro,
} from '../../functions/_domain/reservas/collectionAccounts.ts';
import { D1RepositorioCuentasCobroReserva } from '../../functions/_infrastructure/d1/D1RepositorioCuentasCobroReserva.ts';
import { D1RepositorioBackfillCucuru } from '../../functions/_infrastructure/d1/D1RepositorioBackfillCucuru.ts';
import { D1RepositorioConciliacionCucuru } from '../../functions/_infrastructure/d1/D1RepositorioConciliacionCucuru.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

type TestStatement = {
  query: string;
  values: SQLInputValue[];
  bind(...values: unknown[]): TestStatement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

function d1(sqlite: DatabaseSync) {
  return {
    prepare(query: string): TestStatement {
      return {
        query, values: [],
        bind(...values: unknown[]) { this.values = values as SQLInputValue[]; return this; },
        async first() {
          return sqlite.prepare(this.query).get(...this.values) as Record<string, unknown> | undefined || null;
        },
        async run() { return sqlite.prepare(this.query).run(...this.values); },
      };
    },
    async batch(statements: TestStatement[]) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => ({
          results: /\bRETURNING\b/i.test(statement.query)
            ? sqlite.prepare(statement.query).all(...statement.values) as Record<string, unknown>[]
            : (sqlite.prepare(statement.query).run(...statement.values), []),
        }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

function crearReserva(sqlite: DatabaseSync, uid: string): number {
  return Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen,
      reserva_uid, moneda, monto_total_centavos, monto_sena_centavos, hold_expires_at
    ) VALUES ('QA Cucuru', 1, '2099-10-10', '2099-10-12', 2, 1000, 300,
      'pendiente', 'QA', ?, 'ARS', 100000, 30000, '2099-10-01T00:15:00.000Z')
    RETURNING id
  `).get(uid)?.id);
}

function uuids(...values: string[]) {
  let index = 0;
  return () => values[index++] || `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

test('la feature flag es explícita y la referencia no contiene PII', () => {
  assert.equal(cucuruHabilitado('true'), true);
  assert.equal(cucuruHabilitado(' TRUE '), true);
  assert.equal(cucuruHabilitado('1'), false);
  assert.equal(cucuruHabilitado(undefined), false);
  assert.equal(
    customerIdCuentaCobro('11111111-1111-4111-8111-111111111111'),
    'pm-reserva-11111111-1111-4111-8111-111111111111'
  );
  assert.throws(() => customerIdCuentaCobro('RES-123'), /referencia opaca/);
  assert.equal(aliasCuentaCobro(12, 'magico.qa'), 'magico.qa.reserva12');
  assert.throws(() => aliasCuentaCobro(12, 'prefijo con espacios'), /configuración de alias/);
});

test('la migración 0017 actualiza un preview con 0016 aplicado sin perder observaciones', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre) && nombre <= '0016_cucuru_collection_accounts.sql')
    .sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  sqlite.prepare(`
    INSERT INTO cucuru_observaciones_transferencia (
      collection_id, monto_centavos, moneda, occurred_at, payload_hash, resultado
    ) VALUES ('legacy-col-1', 0, 'ARS', '2026-10-06T12:00:00.000Z', ?, 'prueba_cero')
  `).run('f'.repeat(64));
  sqlite.exec(readFileSync(new URL('../../migrations/0017_cucuru_reconciliation.sql', import.meta.url), 'utf8'));
  assert.equal(sqlite.prepare(`
    SELECT resultado FROM cucuru_observaciones_transferencia WHERE collection_id = 'legacy-col-1'
  `).get()?.resultado, 'prueba_cero');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE version = '0017'").get()?.n, 1);
  assert.doesNotThrow(() => sqlite.prepare(`
    INSERT INTO cucuru_observaciones_transferencia (
      collection_id, monto_centavos, moneda, occurred_at, payload_hash, resultado
    ) VALUES ('new-col-1', 1, 'ARS', '2026-10-06T12:01:00.000Z', ?, 'recibido')
  `).run('e'.repeat(64)));
  sqlite.close();
});

test('la migración 0018 conserva intentos y habilita intentos de alias', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre) && nombre <= '0017_cucuru_reconciliation.sql')
    .sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  const reservaId = crearReserva(sqlite, '99999999-9999-4999-8999-999999999999');
  const cuentaId = Number(sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, ultima_operacion_uid
    ) VALUES (?, 'cucuru', 'pm-reserva-99999999-9999-4999-8999-999999999999',
      'failed', 'op-legacy') RETURNING id
  `).get(reservaId)?.id);
  sqlite.prepare(`
    INSERT INTO cuenta_cobro_intentos (cuenta_cobro_id, operacion_uid, tipo, resultado)
    VALUES (?, 'lookup-legacy', 'lookup', 'failed')
  `).run(cuentaId);

  sqlite.exec(readFileSync(new URL('../../migrations/0018_cucuru_account_aliases.sql', import.meta.url), 'utf8'));

  assert.equal(sqlite.prepare("SELECT tipo FROM cuenta_cobro_intentos WHERE operacion_uid = 'lookup-legacy'").get()?.tipo, 'lookup');
  assert.doesNotThrow(() => sqlite.prepare(`
    INSERT INTO cuenta_cobro_intentos (cuenta_cobro_id, operacion_uid, tipo, resultado)
    VALUES (?, 'alias-nuevo', 'alias', 'started')
  `).run(cuentaId));
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE version = '0018'").get()?.n, 1);
  sqlite.close();
});

test('provisiona fuera de la reserva, busca antes de crear y no duplica la cuenta', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite, '11111111-1111-4111-8111-111111111111');
  const repositorio = new D1RepositorioCuentasCobroReserva(d1(sqlite));
  let busquedas = 0;
  let creaciones = 0;
  const proveedor = {
    async buscarPorCustomerId() { busquedas++; return null; },
    async crear({ customerId }: { customerId: string }) {
      creaciones++;
      return {
        externalAccountId: 'acct-cucuru-1', customerId,
        cvu: '0000003100000000000001', alias: 'pueblo.reserva.1', moneda: 'ARS',
      };
    },
    async asignarAlias() { throw new Error('NO_DEBE_ASIGNAR'); },
  };
  const crearUuid = uuids(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004'
  );

  const primera = await provisionarCuentaCobroReserva(
    { reservaId, habilitada: true, aliasPrefix: 'magico.qa' }, repositorio, proveedor,
    () => new Date('2026-10-06T12:00:00.000Z'), crearUuid
  );
  assert.equal(primera.estado, 'ready');
  if (primera.estado !== 'ready') return;
  assert.equal(primera.cuenta.cvu, '0000003100000000000001');
  assert.equal(busquedas, 1);
  assert.equal(creaciones, 1);

  const repetida = await provisionarCuentaCobroReserva(
    { reservaId, habilitada: true, aliasPrefix: 'magico.qa' }, repositorio, proveedor,
    () => new Date('2026-10-06T12:01:00.000Z'), crearUuid
  );
  assert.equal(repetida.estado, 'ready');
  assert.equal(busquedas, 1);
  assert.equal(creaciones, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM cuentas_cobro_reserva').get()?.cantidad, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM cuenta_cobro_intentos').get()?.cantidad, 2);
  assert.equal(sqlite.prepare("SELECT COUNT(*) cantidad FROM reserva_eventos WHERE tipo = 'cuenta_cobro.lista'").get()?.cantidad, 1);
  sqlite.close();
});

test('desactivada no llama al proveedor y un timeout queda recuperable sin crear a ciegas', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioCuentasCobroReserva(d1(sqlite));
  const deshabilitadaId = crearReserva(sqlite, '22222222-2222-4222-8222-222222222222');
  let llamadas = 0;
  const proveedor = {
    async buscarPorCustomerId() { llamadas++; throw new ErrorProvisionamientoDesconocido(); },
    async crear() { llamadas++; throw new Error('NO_DEBE_CREAR'); },
    async asignarAlias() { llamadas++; throw new Error('NO_DEBE_ASIGNAR'); },
  };
  const deshabilitada = await provisionarCuentaCobroReserva(
    { reservaId: deshabilitadaId, habilitada: false }, repositorio, proveedor,
    () => new Date('2026-10-06T12:00:00.000Z'), uuids('20000000-0000-4000-8000-000000000001')
  );
  assert.equal(deshabilitada.estado, 'disabled');
  assert.equal(llamadas, 0);

  const inciertaId = crearReserva(sqlite, '33333333-3333-4333-8333-333333333333');
  const crearUuid = uuids(
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003'
  );
  const incierta = await provisionarCuentaCobroReserva(
    { reservaId: inciertaId, habilitada: true, aliasPrefix: 'magico.qa' }, repositorio, proveedor,
    () => new Date('2099-10-01T12:00:00.000Z'), crearUuid
  );
  assert.equal(incierta.estado, 'unknown_outcome');
  assert.equal(llamadas, 1);

  const inmediata = await provisionarCuentaCobroReserva(
    { reservaId: inciertaId, habilitada: true, aliasPrefix: 'magico.qa' }, repositorio, proveedor,
    () => new Date('2099-10-01T12:01:00.000Z'), crearUuid
  );
  assert.equal(inmediata.estado, 'unknown_outcome');
  assert.equal(llamadas, 1);
  assert.equal(sqlite.prepare("SELECT resultado FROM cuenta_cobro_intentos WHERE tipo = 'lookup'").get()?.resultado, 'unknown_outcome');
  sqlite.close();
});

test('recupera una cuenta existente sin alias y sólo queda lista después de asignarlo', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite, '44444444-4444-4444-8444-444444444444');
  const repositorio = new D1RepositorioCuentasCobroReserva(d1(sqlite));
  let aliasSolicitado: string | null = null;
  const proveedor = {
    async buscarPorCustomerId(customerId: string) {
      return {
        externalAccountId: '0000003100000000000004', customerId,
        cvu: '0000003100000000000004', alias: null, moneda: 'ARS',
      };
    },
    async crear() { throw new Error('NO_DEBE_CREAR'); },
    async asignarAlias({ cuenta, alias }: { cuenta: any; alias: string }) {
      aliasSolicitado = alias;
      return { ...cuenta, alias };
    },
  };

  const resultado = await provisionarCuentaCobroReserva(
    { reservaId, habilitada: true, aliasPrefix: 'magico.qa' }, repositorio, proveedor,
    () => new Date('2026-10-06T20:30:00.000Z'), uuids(
      '40000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000003',
      '40000000-0000-4000-8000-000000000004'
    )
  );

  assert.equal(resultado.estado, 'ready');
  if (resultado.estado !== 'ready') return;
  assert.equal(aliasSolicitado, `magico.qa.reserva${reservaId}`);
  assert.equal(resultado.cuenta.alias, `magico.qa.reserva${reservaId}`);
  assert.deepEqual(
    sqlite.prepare('SELECT tipo, resultado FROM cuenta_cobro_intentos ORDER BY id').all()
      .map(row => ({ ...row })),
    [{ tipo: 'lookup', resultado: 'succeeded' }, { tipo: 'alias', resultado: 'succeeded' }]
  );
  sqlite.close();
});

test('el backfill pagina con checkpoint, solapamiento UTC y lock exclusivo', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioBackfillCucuru(d1(sqlite));
  const consultas: Array<{ desde: string; hasta: string; cursor: string | null }> = [];
  const procesadas: string[] = [];
  const collection = (id: string) => ({
    collectionId: id, collectorId: 'collector-qa', customerId: null,
    externalAccountId: `acct-${id}`, cvu: null,
    montoCentavos: 30_000, moneda: 'ARS', occurredAt: '2026-10-06T12:00:00.000Z',
    payloadHash: `hash-${id}`,
  });
  const proveedor = {
    async listar(entrada: { desde: string; hasta: string; cursor: string | null }) {
      consultas.push(entrada);
      return entrada.cursor === null
        ? { items: [collection('col-1')], nextCursor: 'page-2' }
        : { items: [collection('col-2')], nextCursor: null };
    },
  };
  const consumidor = { async procesar(item: { collectionId: string }) { procesadas.push(item.collectionId); } };

  const primera = await ejecutarBackfillCucuru(
    repositorio, proveedor, consumidor,
    () => new Date('2026-10-06T13:00:00.000Z'), () => 'lock-backfill-1'
  );
  assert.deepEqual(primera, {
    estado: 'completado', paginas: 2, observaciones: 2,
    desde: '2026-10-05T13:00:00.000Z', hasta: '2026-10-06T13:00:00.000Z',
  });
  assert.deepEqual(procesadas, ['col-1', 'col-2']);
  assert.deepEqual(consultas.map(item => item.cursor), [null, 'page-2']);

  consultas.length = 0;
  await ejecutarBackfillCucuru(
    repositorio, { async listar(entrada) { consultas.push(entrada); return { items: [], nextCursor: null }; } },
    consumidor, () => new Date('2026-10-06T14:00:00.000Z'), () => 'lock-backfill-2'
  );
  assert.equal(consultas[0].desde, '2026-10-06T12:45:00.000Z');
  assert.equal(consultas[0].hasta, '2026-10-06T14:00:00.000Z');

  sqlite.prepare(`UPDATE cucuru_backfill_checkpoints
    SET lock_uid = 'otro-proceso', lock_expires_at = '2099-01-01T00:00:00.000Z'
    WHERE alcance = 'collections'`).run();
  const bloqueada = await ejecutarBackfillCucuru(
    repositorio, proveedor, consumidor,
    () => new Date('2026-10-06T15:00:00.000Z'), () => 'lock-backfill-3'
  );
  assert.deepEqual(bloqueada, { estado: 'locked' });
  sqlite.close();
});

test('concilia una Collection válida exactamente una vez sin usar campos legacy de Mercado Pago', async () => {
  const sqlite = baseCompleta();
  const uid = '44444444-4444-4444-8444-444444444444';
  const reservaId = crearReserva(sqlite, uid);
  sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, external_account_id, cvu,
      alias, moneda, ultima_operacion_uid, ready_at
    ) VALUES (?, 'cucuru', ?, 'ready', 'acct-ready-1', '0000003100000000000004',
      'pueblo.reserva.4', 'ARS', 'ready-operation-4', '2026-10-06T12:00:00.000Z')
  `).run(reservaId, `pm-reserva-${uid}`);
  const repositorio = new D1RepositorioConciliacionCucuru(d1(sqlite));
  const collection = {
    collectionId: 'collection-ready-1', collectorId: 'collector-qa',
    customerId: `pm-reserva-${uid}`, externalAccountId: 'acct-ready-1',
    cvu: '0000003100000000000004', montoCentavos: 30_000, moneda: 'ARS',
    occurredAt: '2026-10-06T12:30:00.000Z', payloadHash: 'a'.repeat(64),
  };
  const primera = await procesarCollectionCucuru(
    collection, 'collector-qa', repositorio,
    'request-cucuru-1'
  );
  assert.equal(primera.estado, 'aplicado');
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, estado_flujo, mp_payment_id FROM reservas WHERE id = ?
  `).get(reservaId) }, { estado: 'confirmada', estado_flujo: 'confirmada', mp_payment_id: null });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT proveedor, estado, external_payment_id FROM pagos WHERE reserva_id = ?
  `).get(reservaId) }, {
    proveedor: 'cucuru', estado: 'aprobado', external_payment_id: 'collection-ready-1',
  });

  const duplicada = await procesarCollectionCucuru(
    collection, 'collector-qa', repositorio,
    'request-cucuru-duplicate'
  );
  assert.equal(duplicada.estado, 'duplicado');
  const inconsistente = await procesarCollectionCucuru(
    { ...collection, payloadHash: 'd'.repeat(64) }, 'collector-qa', repositorio,
    'request-cucuru-inconsistent'
  );
  assert.equal(inconsistente.estado, 'revision_manual');
  assert.equal(inconsistente.motivoCodigo, 'DUPLICADO_INCONSISTENTE');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'cucuru'").get()?.n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM reserva_eventos WHERE evento_uid = 'pago:cucuru:collection-ready-1:aprobado'").get()?.n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM cucuru_revisiones_pago WHERE motivo_codigo = 'DUPLICADO_INCONSISTENTE'").get()?.n, 1);
  sqlite.close();
});

test('marca como mock toda la trazabilidad de un cobro sobre una cuenta simulada', async () => {
  const sqlite = baseCompleta();
  const uid = '88888888-8888-4888-8888-888888888888';
  const reservaId = crearReserva(sqlite, uid);
  sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, external_account_id, cvu,
      alias, moneda, ultima_operacion_uid, ready_at, simulada
    ) VALUES (?, 'cucuru', ?, 'ready', 'mock-8888888888888888',
      '9900000000000000000008', 'magico.qa.reserva8', 'ARS',
      'ready-operation-mock-8', '2026-10-07T12:00:00.000Z', 1)
  `).run(reservaId, `pm-reserva-${uid}`);

  const resultado = await procesarCollectionCucuru({
    collectionId: 'collection-mock-8',
    collectorId: 'collector-qa',
    customerId: `pm-reserva-${uid}`,
    externalAccountId: 'mock-8888888888888888',
    cvu: '9900000000000000000008',
    montoCentavos: 30_000,
    moneda: 'ARS',
    occurredAt: '2026-10-07T12:05:00.000Z',
    payloadHash: '8'.repeat(64),
  }, 'collector-qa', new D1RepositorioConciliacionCucuru(d1(sqlite)), 'request-mock-8');

  assert.equal(resultado.estado, 'aplicado');
  assert.equal(sqlite.prepare(`
    SELECT simulada FROM cucuru_observaciones_transferencia
    WHERE collection_id = 'collection-mock-8'
  `).get()?.simulada, 1);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT proveedor, estado, metadata_json FROM pagos WHERE reserva_id = ?
  `).get(reservaId) }, {
    proveedor: 'cucuru_mock',
    estado: 'aprobado',
    metadata_json: '{"collection_id":"collection-mock-8","simulada":1}',
  });
  assert.equal(sqlite.prepare(`
    SELECT proveedor FROM pago_eventos_externos
    WHERE evento_externo_id = 'collection-mock-8'
  `).get()?.proveedor, 'cucuru_mock');
  const evento = sqlite.prepare(`
    SELECT actor_ref, evento_uid, payload_json FROM reserva_eventos
    WHERE evento_uid = 'pago:cucuru_mock:collection-mock-8:aprobado'
  `).get();
  assert.equal(evento?.actor_ref, 'cucuru_mock');
  assert.match(String(evento?.payload_json), /"simulada":1/);
  sqlite.close();
});

test('la prueba cero no concilia y los importes incorrectos van a revisión manual', async () => {
  const sqlite = baseCompleta();
  const uid = '55555555-5555-4555-8555-555555555555';
  const reservaId = crearReserva(sqlite, uid);
  sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, external_account_id, cvu,
      moneda, ultima_operacion_uid, ready_at
    ) VALUES (?, 'cucuru', ?, 'ready', 'acct-ready-5', '0000003100000000000005',
      'ARS', 'ready-operation-5', '2026-10-06T12:00:00.000Z')
  `).run(reservaId, `pm-reserva-${uid}`);
  const repositorio = new D1RepositorioConciliacionCucuru(d1(sqlite));
  const base = {
    collectorId: 'collector-qa', customerId: `pm-reserva-${uid}`,
    externalAccountId: 'acct-ready-5', cvu: '0000003100000000000005', moneda: 'ARS',
    occurredAt: '2026-10-06T12:30:00.000Z', payloadHash: 'b'.repeat(64),
  };
  const cero = await procesarCollectionCucuru(
    { ...base, collectionId: 'collection-zero-5', montoCentavos: 0 },
    'collector-qa', repositorio, 'request-zero-5'
  );
  assert.equal(cero.estado, 'prueba_cero');
  assert.equal(cero.motivoCodigo, 'PRUEBA_IMPORTE_CERO');

  const ceroSinCuenta = await procesarCollectionCucuru(
    {
      ...base,
      collectionId: 'collection-zero-sin-cuenta',
      customerId: null,
      externalAccountId: null,
      cvu: null,
      montoCentavos: 0,
      payloadHash: 'e'.repeat(64),
    },
    'collector-qa', repositorio, 'request-zero-sin-cuenta'
  );
  assert.equal(ceroSinCuenta.estado, 'prueba_cero');

  const incorrecta = await procesarCollectionCucuru(
    { ...base, collectionId: 'collection-wrong-5', montoCentavos: 29_999, payloadHash: 'c'.repeat(64) },
    'collector-qa', repositorio, 'request-wrong-5'
  );
  assert.equal(incorrecta.estado, 'revision_manual');
  assert.equal(incorrecta.motivoCodigo, 'MONTO_INCORRECTO');
  assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas WHERE id = ?').get(reservaId)?.estado_flujo, 'pendiente_pago');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'cucuru'").get()?.n, 0);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM cucuru_revisiones_pago WHERE estado = 'pendiente'").get()?.n, 1);
  await assert.rejects(
    procesarCollectionCucuru(
      { ...base, collectionId: 'collection-bad-collector', montoCentavos: 30_000 },
      'collector-real', repositorio, 'request-invalid'
    ),
    /observación de Cucuru es inválida/
  );
  sqlite.close();
});

test('el backfill usa la fecha del cobro y no la hora tardía de procesamiento', async () => {
  const sqlite = baseCompleta();
  const uid = '77777777-7777-4777-8777-777777777777';
  const reservaId = crearReserva(sqlite, uid);
  sqlite.prepare("UPDATE reservas SET hold_expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(reservaId);
  sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, external_account_id, cvu,
      moneda, ultima_operacion_uid, ready_at
    ) VALUES (?, 'cucuru', ?, 'ready', 'acct-timely-7', '0000003100000000000007',
      'ARS', 'ready-operation-7', '1999-12-30T00:00:00.000Z')
  `).run(reservaId, `pm-reserva-${uid}`);

  const resultado = await procesarCollectionCucuru({
    collectionId: 'collection-timely-7',
    collectorId: 'collector-qa',
    customerId: `pm-reserva-${uid}`,
    externalAccountId: 'acct-timely-7',
    cvu: '0000003100000000000007',
    montoCentavos: 30_000,
    moneda: 'ARS',
    occurredAt: '1999-12-31T23:59:59.000Z',
    payloadHash: 'f'.repeat(64),
  }, 'collector-qa', new D1RepositorioConciliacionCucuru(d1(sqlite)), 'request-timely-backfill');

  assert.equal(resultado.estado, 'aplicado');
  assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas WHERE id = ?').get(reservaId)?.estado_flujo, 'confirmada');
  sqlite.close();
});
