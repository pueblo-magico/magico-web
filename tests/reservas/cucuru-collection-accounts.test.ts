import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { provisionarCuentaCobroReserva } from '../../functions/_application/reservas/provisionarCuentaCobro.ts';
import {
  ErrorProvisionamientoDesconocido,
  cucuruHabilitado,
  customerIdCuentaCobro,
} from '../../functions/_domain/reservas/collectionAccounts.ts';
import { D1RepositorioCuentasCobroReserva } from '../../functions/_infrastructure/d1/D1RepositorioCuentasCobroReserva.ts';

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
  };
  const crearUuid = uuids(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004'
  );

  const primera = await provisionarCuentaCobroReserva(
    { reservaId, habilitada: true }, repositorio, proveedor,
    () => new Date('2026-10-06T12:00:00.000Z'), crearUuid
  );
  assert.equal(primera.estado, 'ready');
  if (primera.estado !== 'ready') return;
  assert.equal(primera.cuenta.cvu, '0000003100000000000001');
  assert.equal(busquedas, 1);
  assert.equal(creaciones, 1);

  const repetida = await provisionarCuentaCobroReserva(
    { reservaId, habilitada: true }, repositorio, proveedor,
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
    { reservaId: inciertaId, habilitada: true }, repositorio, proveedor,
    () => new Date('2099-10-01T12:00:00.000Z'), crearUuid
  );
  assert.equal(incierta.estado, 'unknown_outcome');
  assert.equal(llamadas, 1);

  const inmediata = await provisionarCuentaCobroReserva(
    { reservaId: inciertaId, habilitada: true }, repositorio, proveedor,
    () => new Date('2099-10-01T12:01:00.000Z'), crearUuid
  );
  assert.equal(inmediata.estado, 'unknown_outcome');
  assert.equal(llamadas, 1);
  assert.equal(sqlite.prepare("SELECT resultado FROM cuenta_cobro_intentos WHERE tipo = 'lookup'").get()?.resultado, 'unknown_outcome');
  sqlite.close();
});
