import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { onRequestGet as disponibilidad } from '../../functions/api/v1/integrations/reservas/disponibilidad.ts';
import { onRequestPost as cotizaciones } from '../../functions/api/v1/integrations/reservas/cotizaciones.ts';

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

const SECRET_MANYCHAT = 'manychat-inbound-secret-123456789';
const SECRET_N8N = 'n8n-inbound-secret-seguro-123456';

function headers(identidad: 'manychat' | 'n8n', secreto: string, json = false) {
  return {
    'X-Integration-Id': identidad,
    'X-Service-Secret': secreto,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

test('los contratos v1 autentican identidades separadas y no exponen datos internos', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const url = 'https://test/api/v1/integrations/reservas/disponibilidad' +
    '?check_in=2027-11-10&check_out=2027-11-12&personas=2&tipo_alojamiento=domo&modalidad=privada';

  const sinCredencial = await disponibilidad({ request: new Request(url), env });
  assert.equal(sinCredencial.status, 401);
  assert.deepEqual(await sinCredencial.json(), {
    error: { codigo: 'NO_AUTORIZADO', mensaje: 'La identidad o credencial no es válida.', reintentable: false },
    meta: { version: 'v1' },
  });

  const response = await disponibilidad({
    request: new Request(url, { headers: headers('manychat', SECRET_MANYCHAT) }), env,
  });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.integracion, 'manychat');
  assert.equal(body.data.estado, 'disponible');
  assert.equal(body.data.opcion.espacio_codigo, 'domo-1');
  assert.equal(JSON.stringify(body).includes('cliente_'), false);
  assert.equal(JSON.stringify(body).includes('alojamiento_id'), false);
  sqlite.close();
});

test('n8n cotiza con el mismo caso de uso y recibe importes versionados', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const request = new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
    method: 'POST', headers: headers('n8n', SECRET_N8N, true),
    body: JSON.stringify({
      check_in: '2027-11-10', check_out: '2027-11-12', personas: 2,
      tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      regimen_alimentacion: 'desayuno_incluido',
    }),
  });
  const response = await cotizaciones({ request, env });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.version, 'v1');
  assert.equal(body.meta.integracion, 'n8n');
  assert.equal(body.data.estado, 'disponible');
  assert.equal(Number.isInteger(body.data.precio.subtotal_centavos), true);
  assert.equal(Number.isInteger(body.data.precio.sena_centavos), true);
  assert.match(body.data.cotizacion.codigo, /^COT-/);
  sqlite.close();
});

test('manychat no puede usar el secreto de n8n y los errores son consumibles', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const response = await cotizaciones({
    request: new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
      method: 'POST', headers: headers('manychat', SECRET_N8N, true), body: '{}',
    }), env,
  });
  assert.equal(response.status, 401);
  const body = await response.json() as any;
  assert.equal(body.error.codigo, 'NO_AUTORIZADO');
  assert.equal(body.error.reintentable, false);
  sqlite.close();
});
