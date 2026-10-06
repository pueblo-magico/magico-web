import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { ErrorProvisionamientoDesconocido } from '../../functions/_domain/reservas/collectionAccounts.ts';
import {
  CucuruClienteHttp,
  normalizarCollectionCucuru,
} from '../../functions/_infrastructure/cucuru/CucuruProveedorCuentasCobro.ts';
import { autenticarWebhookCucuru } from '../../functions/api/v1/integrations/cucuru/collection_received.ts';
import { onRequestPost as webhookCucuru } from '../../functions/api/v1/integrations/cucuru/collection_received.ts';

const configuracion = {
  apiKey: 'api-key-prueba',
  collectorId: 'collector-prueba',
  baseUrl: 'https://cucuru.test',
};

type TestStatement = {
  query: string;
  values: SQLInputValue[];
  bind(...values: unknown[]): TestStatement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

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

test('busca una cuenta por customer_id recorriendo next_page hasta EOF', async () => {
  const llamadas: Array<{ url: string; headers: Headers }> = [];
  const fetcher = async (url: string, init?: RequestInit) => {
    llamadas.push({ url, headers: new Headers(init?.headers) });
    const paginaDos = new URL(url).searchParams.get('next_page') === 'pagina-2';
    return Response.json(paginaDos ? {
      accounts: [{
        account_number: '0000277800000000000483',
        customer_id: 'pm-reserva-11111111-1111-4111-8111-111111111111',
        alias: 'pueblo.reserva.1',
      }],
      next_page: 'EOF',
    } : {
      accounts: [{ account_number: '0000277800000000000482', customer_id: 'otra-reserva' }],
      next_page: 'pagina-2',
    });
  };
  const cliente = new CucuruClienteHttp(configuracion, fetcher);
  const cuenta = await cliente.buscarPorCustomerId('pm-reserva-11111111-1111-4111-8111-111111111111');

  assert.equal(cuenta?.cvu, '0000277800000000000483');
  assert.equal(cuenta?.alias, 'pueblo.reserva.1');
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[0].headers.get('X-Cucuru-Api-Key'), 'api-key-prueba');
  assert.equal(llamadas[0].headers.get('X-Cucuru-Collector-id'), 'collector-prueba');
  assert.equal(new URL(llamadas[1].url).searchParams.get('next_page'), 'pagina-2');
});

test('crea un CVU read-only y trata un timeout como resultado desconocido', async () => {
  let request: { url: string; init?: RequestInit } | null = null;
  const cliente = new CucuruClienteHttp(configuracion, async (url, init) => {
    request = { url, init };
    return Response.json({ account_number: '0000277800000000000483' });
  });
  const customerId = 'pm-reserva-11111111-1111-4111-8111-111111111111';
  const cuenta = await cliente.crear({ customerId, idempotencyKey: 'operacion-local' });

  assert.equal(request?.init?.method, 'PUT');
  assert.equal(new URL(request?.url || '').pathname, '/app/v1/Collection/accounts/account');
  assert.deepEqual(JSON.parse(String(request?.init?.body)), { customer_id: customerId, read_only: 'true' });
  assert.equal(cuenta.customerId, customerId);
  assert.equal(cuenta.cvu, '0000277800000000000483');

  const incierto = new CucuruClienteHttp(configuracion, async () => {
    throw new Error('timeout');
  });
  await assert.rejects(
    incierto.crear({ customerId, idempotencyKey: 'operacion-incierta' }),
    ErrorProvisionamientoDesconocido
  );
});

test('normaliza Collections paginadas sin depender de transfer_data ni datos del pagador', async () => {
  const payload = {
    collection_id: 'collection-1',
    collection_trace_id: 'trace-1',
    date_time: '2026-10-06T12:30:00.000Z',
    customer_id: 'pm-reserva-11111111-1111-4111-8111-111111111111',
    currency_id: 'ARS',
    amount: 45000,
    customer_tax_id: 'dato-no-persistido',
    customer_name: 'dato-no-persistido',
    collection_account: '0000277800000000000483',
    transfer_data: '{"no":"usar"}',
  };
  const cliente = new CucuruClienteHttp(configuracion, async url => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/app/v1/Collection/collections');
    assert.equal(parsed.searchParams.get('date_from'), '2026-10-06T12:00:00');
    assert.equal(parsed.searchParams.get('date_to'), '2026-10-06T13:00:00');
    return Response.json({
      collections: [payload, {
        ...payload,
        collection_id: 'collection-rejected',
        status: 'rejected',
      }],
      next_page: 'EOF',
    });
  });
  const pagina = await cliente.listar({
    desde: '2026-10-06T12:00:00.000Z',
    hasta: '2026-10-06T13:00:00.000Z',
    cursor: null,
    limite: 100,
  });
  assert.equal(pagina.nextCursor, null);
  assert.deepEqual(pagina.items[0], {
    collectionId: 'collection-1',
    collectorId: 'collector-prueba',
    customerId: 'pm-reserva-11111111-1111-4111-8111-111111111111',
    externalAccountId: '0000277800000000000483',
    cvu: '0000277800000000000483',
    montoCentavos: 4_500_000,
    moneda: 'ARS',
    occurredAt: '2026-10-06T12:30:00.000Z',
    payloadHash: pagina.items[0].payloadHash,
  });
  assert.match(pagina.items[0].payloadHash, /^[a-f0-9]{64}$/);
  assert.equal(pagina.items.length, 1);

  const equivalente = await normalizarCollectionCucuru({
    ...payload,
    collector_id: 'collector-prueba',
    customer_name: 'otro nombre',
    transfer_data: '{"cambio":"irrelevante"}',
  });
  assert.equal(equivalente.payloadHash, pagina.items[0].payloadHash);
});

test('normaliza el timestamp corto del webhook y exige su secreto configurado', async () => {
  const collection = await normalizarCollectionCucuru({
    collector_id: 'collector-prueba',
    collection_id: 'collection-webhook-1',
    date_time: '2026-10-06 12:30',
    customer_id: 'pm-reserva-11111111-1111-4111-8111-111111111111',
    currency_id: 'ARS',
    amount: 0,
    collection_account: '0000277800000000000483',
  });
  assert.equal(collection.occurredAt, '2026-10-06T12:30:00.000Z');
  assert.equal(collection.montoCentavos, 0);

  const secreto = 'secreto-cucuru-con-longitud-segura';
  const request = new Request('https://test/api/v1/integrations/cucuru/collection_received', {
    headers: { 'X-Cucuru-Webhook-Secret': secreto },
  });
  assert.equal(autenticarWebhookCucuru(request, { CUCURU_WEBHOOK_SECRET: secreto }), true);
  assert.equal(autenticarWebhookCucuru(request, { CUCURU_WEBHOOK_SECRET: 'otro-secreto-de-longitud-segura' }), false);
  assert.equal(autenticarWebhookCucuru(request, {}), false);
});

test('el webhook autentica, concilia una Collection y responde idempotentemente', async () => {
  const sqlite = baseCompleta();
  const uid = '66666666-6666-4666-8666-666666666666';
  const reservaId = Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen,
      reserva_uid, moneda, monto_total_centavos, monto_sena_centavos, hold_expires_at
    ) VALUES ('QA Webhook Cucuru', 1, '2099-10-10', '2099-10-12', 2, 1000, 300,
      'pendiente', 'QA', ?, 'ARS', 100000, 30000, '2099-10-01T00:15:00.000Z')
    RETURNING id
  `).get(uid)?.id);
  sqlite.prepare(`
    INSERT INTO cuentas_cobro_reserva (
      reserva_id, proveedor, customer_id, estado, external_account_id, cvu,
      moneda, ultima_operacion_uid, ready_at
    ) VALUES (?, 'cucuru', ?, 'ready', ?, ?, 'ARS', 'ready-webhook', '2026-10-06T12:00:00.000Z')
  `).run(
    reservaId,
    `pm-reserva-${uid}`,
    '0000277800000000000483',
    '0000277800000000000483'
  );
  const secreto = 'secreto-cucuru-con-longitud-segura';
  const body = {
    collector_id: 'collector-prueba',
    collection_id: 'collection-webhook-e2e',
    collection_trace_id: 'trace-e2e',
    date_time: '2026-10-06T12:30:00.000Z',
    customer_id: `pm-reserva-${uid}`,
    currency_id: 'ARS',
    amount: 300,
    collection_account: '0000277800000000000483',
  };
  const ejecutar = () => webhookCucuru({
    request: new Request('https://test/api/v1/integrations/cucuru/collection_received', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cucuru-Webhook-Secret': secreto,
        'X-Request-ID': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    }),
    env: {
      DB: d1(sqlite),
      CUCURU_WEBHOOK_SECRET: secreto,
      CUCURU_COLLECTOR_ID: 'collector-prueba',
      MANYCHAT_NOTIFICATIONS_ENABLED: 'false',
    },
  });

  const primera = await ejecutar();
  const repetida = await ejecutar();
  assert.equal(primera.status, 200);
  assert.equal((await primera.json() as any).estado, 'aplicado');
  assert.equal(repetida.status, 200);
  assert.equal((await repetida.json() as any).estado, 'duplicado');
  assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas WHERE id = ?').get(reservaId)?.estado_flujo, 'confirmada');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'cucuru'").get()?.n, 1);

  const noAutorizada = await webhookCucuru({
    request: new Request('https://test/api/v1/integrations/cucuru/collection_received', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    env: { DB: d1(sqlite), CUCURU_WEBHOOK_SECRET: secreto, CUCURU_COLLECTOR_ID: 'collector-prueba' },
  });
  assert.equal(noAutorizada.status, 401);
  sqlite.close();
});
