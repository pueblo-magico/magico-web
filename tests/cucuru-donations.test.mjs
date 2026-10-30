import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  autenticarWebhookCucuru,
  normalizarCollectionCucuru,
} from '../functions/_lib/cucuruDonations.ts';
import { procesarWebhookCucuru } from '../functions/api/v1/integrations/cucuru.ts';
import { consultarResumenAportes } from '../functions/api/v1/reforestacion/aportes/resumen.ts';

const SECRET = 'secreto-cucuru-de-prueba-seguro';
const COLLECTOR = 'collector-reforestacion';
const DONATION_ACCOUNT = '0000277800000000000483';

function createDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../add_cucuru_donations.sql', import.meta.url), 'utf8'));
  return sqlite;
}

function d1(sqlite) {
  return {
    prepare(query) {
      return {
        query,
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          return sqlite.prepare(this.query).get(...this.values) || null;
        },
        async run() {
          return sqlite.prepare(this.query).run(...this.values);
        },
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => ({
          results: /\bRETURNING\b/i.test(statement.query)
            ? sqlite.prepare(statement.query).all(...statement.values)
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

function payload(overrides = {}) {
  return {
    collector_id: COLLECTOR,
    collection_id: 'collection-donation-1',
    collection_trace_id: 'trace-donation-1',
    date_time: '2026-10-30 12:30',
    customer_id: 'reforestacion-aporte-1',
    currency_id: 'ARS',
    amount: '15000.50',
    collection_account: DONATION_ACCOUNT,
    customer_name: 'no se persiste',
    customer_tax_id: 'no se persiste',
    transfer_data: '{"no":"persistir"}',
    ...overrides,
  };
}

function request(body, secret = SECRET) {
  return new Request('https://example.test/api/v1/integrations/cucuru', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Cucuru-Webhook-Secret': secret,
      'X-Request-ID': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
}

function environment(sqlite) {
  return {
    DB: d1(sqlite),
    CUCURU_WEBHOOK_SECRET: SECRET,
    CUCURU_COLLECTOR_ID: COLLECTOR,
    CUCURU_DONATIONS_ACCOUNT: DONATION_ACCOUNT,
  };
}

test('exige el secreto de webhook y lo compara sin aceptar variantes', () => {
  const valid = request(payload());
  assert.equal(autenticarWebhookCucuru(valid, { CUCURU_WEBHOOK_SECRET: SECRET }), true);
  assert.equal(autenticarWebhookCucuru(valid, { CUCURU_WEBHOOK_SECRET: `${SECRET}-otro` }), false);
  assert.equal(autenticarWebhookCucuru(valid, {}), false);
});

test('normaliza únicamente los campos conciliables y calcula centavos exactos', async () => {
  const collection = await normalizarCollectionCucuru(payload());
  assert.deepEqual(collection, {
    collectionId: 'collection-donation-1',
    collectorId: COLLECTOR,
    customerId: 'reforestacion-aporte-1',
    accountNumber: DONATION_ACCOUNT,
    amountCents: 1_500_050,
    currency: 'ARS',
    occurredAt: '2026-10-30T12:30:00.000Z',
    payloadHash: collection.payloadHash,
  });
  assert.match(collection.payloadHash, /^[a-f0-9]{64}$/);
});

test('acepta la prueba autenticada de importe cero sin persistirla', async () => {
  const sqlite = createDatabase();
  const response = await procesarWebhookCucuru(request({ amount: 0 }), environment(sqlite));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, estado: 'prueba_cero' });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_webhook_eventos').get().n, 0);
  sqlite.close();
});

test('registra un aporte una sola vez frente a redeliveries idénticas', async () => {
  const sqlite = createDatabase();
  const env = environment(sqlite);

  const first = await procesarWebhookCucuru(request(payload()), env);
  const duplicate = await procesarWebhookCucuru(request(payload()), env);

  assert.equal(first.status, 200);
  assert.equal((await first.json()).estado, 'aplicado');
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).estado, 'duplicado');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_webhook_eventos').get().n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reforestacion_aportes').get().n, 1);
  assert.equal(
    sqlite.prepare('SELECT amount_cents FROM reforestacion_aportes').get().amount_cents,
    1_500_050,
  );
  sqlite.close();
});

test('suma los aportes confirmados y cuenta cada Collection una sola vez', async () => {
  const sqlite = createDatabase();
  const env = environment(sqlite);

  await procesarWebhookCucuru(request(payload()), env);
  await procesarWebhookCucuru(request(payload()), env);
  await procesarWebhookCucuru(request(payload({
    collection_id: 'collection-donation-2',
    collection_trace_id: 'trace-donation-2',
    amount: '25000',
  })), env);

  assert.deepEqual(await consultarResumenAportes(env.DB), {
    amountCents: 4_000_050,
    donationsCount: 2,
    currency: 'ARS',
  });
  sqlite.close();
});

test('no mezcla como donación una Collection recibida en otra cuenta', async () => {
  const sqlite = createDatabase();
  const response = await procesarWebhookCucuru(request(payload({
    collection_id: 'collection-other-account',
    collection_account: '0000277800000000000484',
  })), environment(sqlite));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    estado: 'revision_manual',
    motivo: 'CUENTA_NO_ES_REFORESTACION',
  });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reforestacion_aportes').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_revisiones_aporte').get().n, 1);
  sqlite.close();
});

test('una moneda inesperada queda en revisión y una Collection rechazada se ignora', async () => {
  const sqlite = createDatabase();
  const env = environment(sqlite);
  const unexpectedCurrency = await procesarWebhookCucuru(request(payload({
    collection_id: 'collection-usd',
    currency_id: 'USD',
  })), env);
  const rejected = await procesarWebhookCucuru(request(payload({
    collection_id: 'collection-rejected',
    status: 'rejected',
  })), env);

  assert.deepEqual(await unexpectedCurrency.json(), {
    ok: true,
    estado: 'revision_manual',
    motivo: 'MONEDA_NO_ESPERADA',
  });
  assert.deepEqual(await rejected.json(), {
    ok: true,
    estado: 'ignorado',
    motivo: 'COLLECTION_RECHAZADA',
  });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reforestacion_aportes').get().n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_webhook_eventos').get().n, 1);
  sqlite.close();
});

test('una redelivery con el mismo ID y datos distintos queda en revisión', async () => {
  const sqlite = createDatabase();
  const env = environment(sqlite);
  await procesarWebhookCucuru(request(payload()), env);
  const inconsistent = await procesarWebhookCucuru(request(payload({ amount: 16000 })), env);

  assert.equal(inconsistent.status, 200);
  assert.deepEqual(await inconsistent.json(), {
    ok: true,
    estado: 'revision_manual',
    motivo: 'DUPLICADO_INCONSISTENTE',
  });
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reforestacion_aportes').get().n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_revisiones_aporte').get().n, 1);
  sqlite.close();
});

test('rechaza una Collection real sin autenticación', async () => {
  const sqlite = createDatabase();
  const response = await procesarWebhookCucuru(request(payload(), 'secreto-incorrecto-de-longitud-suficiente'), environment(sqlite));
  assert.equal(response.status, 401);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM cucuru_webhook_eventos').get().n, 0);
  sqlite.close();
});
