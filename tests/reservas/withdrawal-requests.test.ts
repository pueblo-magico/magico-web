import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { createSessionToken } from '../../functions/_lib/session.ts';
import { onRequestGet as listarAdmin } from '../../functions/api/v1/admin/arrepentimientos/index.ts';
import { onRequestPatch as actualizarAdmin } from '../../functions/api/v1/admin/arrepentimientos/[id].ts';
import { onRequestPost as crearPublica } from '../../functions/api/v1/public/arrepentimientos.ts';

const SECRET = 'session-secret-seguro-de-al-menos-32-caracteres';

function d1(sqlite: DatabaseSync) {
  return {
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...next: unknown[]) { values = next; return this; },
        async first() { return sqlite.prepare(query).get(...values as any[]); },
        async all() { return { results: sqlite.prepare(query).all(...values as any[]) }; },
        async run() { return sqlite.prepare(query).run(...values as any[]); },
      };
    },
  };
}

function base() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const nombres = readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort();
  for (const nombre of nombres) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  sqlite.exec(`
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
      ('editor@test', 'x', 'editor'),
      ('viewer@test', 'x', 'viewer');
    INSERT INTO reservas (
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, codigo, reserva_uid
    ) VALUES (
      'Huésped QA', 'guest@example.test', 1, '2027-09-10', '2027-09-12',
      2, 150000, 45000, 'confirmada', 'RES-12345678-ABCD', 'reserva-withdrawal-qa'
    );
  `);
  return { sqlite, env: { DB: d1(sqlite), SESSION_SECRET: SECRET, RATE_LIMIT_SALT: 'withdrawal-tests-salt' } };
}

function publica(env: any, clave: string, overrides: Record<string, unknown> = {}) {
  return crearPublica({
    request: new Request('https://test/api/v1/public/arrepentimientos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': clave,
        'CF-Connecting-IP': '203.0.113.10',
      },
      body: JSON.stringify({
        reserva_codigo: 'RES-12345678-ABCD',
        email: 'Guest@Example.Test',
        detalle: 'Quiero revocar la contratación realizada en el sitio.',
        ...overrides,
      }),
    }),
    env,
  });
}

async function requestAdmin(env: any, email: string, method: 'GET' | 'PATCH', url: string, body?: unknown) {
  const csrf = `csrf-${email}`;
  const token = await createSessionToken(email, SECRET, csrf);
  return new Request(url, {
    method,
    headers: {
      Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      ...(method === 'PATCH' ? { 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('registra una constancia idempotente y vincula la reserva sin exponerla al público', async () => {
  const { sqlite, env } = base();
  const primera = await publica(env, 'withdrawal-qa-0001');
  assert.equal(primera.status, 201);
  const body: any = await primera.json();
  assert.match(body.data.solicitud.codigo, /^ARR-[0-9a-f-]{36}$/);
  assert.equal(body.data.solicitud.estado, 'recibida');
  assert.equal(body.meta.idempotente, false);
  assert.equal('reserva_id' in body.data.solicitud, false);

  const retry = await publica(env, 'withdrawal-qa-0001');
  assert.equal(retry.status, 200);
  const retryBody: any = await retry.json();
  assert.equal(retryBody.data.solicitud.codigo, body.data.solicitud.codigo);
  assert.equal(retryBody.meta.idempotente, true);

  const row = sqlite.prepare(`
    SELECT reserva_id, email_contacto, COUNT(*) OVER () cantidad
    FROM solicitudes_arrepentimiento
  `).get();
  assert.deepEqual({ ...row }, { reserva_id: 1, email_contacto: 'guest@example.test', cantidad: 1 });
  sqlite.close();
});

test('rechaza abuso de idempotencia y datos públicos inválidos', async () => {
  const { sqlite, env } = base();
  await publica(env, 'withdrawal-qa-0002');
  const reutilizada = await publica(env, 'withdrawal-qa-0002', { detalle: 'Un detalle completamente diferente para la misma clave.' });
  assert.equal(reutilizada.status, 409);
  assert.equal((await reutilizada.json() as any).error.codigo, 'IDEMPOTENCY_KEY_REUTILIZADA');

  const emailInvalido = await publica(env, 'withdrawal-qa-0003', { email: 'incorrecto' });
  assert.equal(emailInvalido.status, 400);
  assert.equal((await emailInvalido.json() as any).error.codigo, 'EMAIL_INVALIDO');
  sqlite.close();
});

test('admin consulta y resuelve con RBAC, CSRF y auditoría', async () => {
  const { sqlite, env } = base();
  await publica(env, 'withdrawal-qa-0004');
  const id = Number(sqlite.prepare('SELECT id FROM solicitudes_arrepentimiento').get()?.id);

  const getRequest = await requestAdmin(env, 'viewer@test', 'GET', 'https://test/api/v1/admin/arrepentimientos');
  const listado = await listarAdmin({ request: getRequest, env });
  assert.equal(listado.status, 200);
  assert.equal((await listado.json() as any).data[0].email, 'guest@example.test');

  const patchViewer = await requestAdmin(env, 'viewer@test', 'PATCH', `https://test/api/v1/admin/arrepentimientos/${id}`, {
    estado_actual: 'recibida', estado: 'resuelta', motivo: 'Solicitud verificada',
  });
  assert.equal((await actualizarAdmin({ request: patchViewer, env, params: { id } })).status, 403);

  const patchEditor = await requestAdmin(env, 'editor@test', 'PATCH', `https://test/api/v1/admin/arrepentimientos/${id}`, {
    estado_actual: 'recibida', estado: 'en_revision', motivo: 'Verificación iniciada',
  });
  const actualizada = await actualizarAdmin({ request: patchEditor, env, params: { id } });
  assert.equal(actualizada.status, 200);
  assert.equal((await actualizada.json() as any).data.estado, 'en_revision');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM auditoria_admin WHERE accion = 'resolver_solicitud_arrepentimiento'").get()?.n, 1);

  const repetida = await requestAdmin(env, 'editor@test', 'PATCH', `https://test/api/v1/admin/arrepentimientos/${id}`, {
    estado_actual: 'recibida', estado: 'en_revision', motivo: 'Repetición segura',
  });
  assert.equal((await actualizarAdmin({ request: repetida, env, params: { id } })).status, 409);
  sqlite.close();
});
