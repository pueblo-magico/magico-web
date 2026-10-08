import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { createSessionToken } from '../../functions/_lib/session.ts';
import { onRequestGet as listarAdmin } from '../../functions/api/v1/admin/arrepentimientos/index.ts';
import { onRequestPatch as actualizarAdmin } from '../../functions/api/v1/admin/arrepentimientos/[id].ts';
import { onRequestPost as reprocesarAdmin } from '../../functions/api/v1/admin/arrepentimientos/notificaciones/reprocesar.ts';
import {
  onRequestGet as consultarPublica,
  onRequestPost as crearPublica,
} from '../../functions/api/v1/public/arrepentimientos.ts';
import { onRequestPost as entregarNotificacion } from '../../functions/api/v1/integrations/arrepentimientos/notificaciones.ts';

const SECRET = 'session-secret-seguro-de-al-menos-32-caracteres';

function d1(sqlite: DatabaseSync) {
  class Statement {
    private values: unknown[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
    bind(...next: unknown[]) { this.values = next; return this; }
    async first() { return sqlite.prepare(this.query).get(...this.values as any[]); }
    async all() { return { results: sqlite.prepare(this.query).all(...this.values as any[]) }; }
    async run() { return sqlite.prepare(this.query).run(...this.values as any[]); }
  }
  return {
    prepare(query: string) {
      return new Statement(query);
    },
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN IMMEDIATE');
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
  return { sqlite, env: {
    DB: d1(sqlite), SESSION_SECRET: SECRET, RATE_LIMIT_SALT: 'withdrawal-tests-salt',
    N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-al-menos-32-caracteres',
  } };
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
        idioma: 'es',
        ...overrides,
      }),
    }),
    env,
  });
}

async function requestAdmin(env: any, email: string, method: 'GET' | 'PATCH' | 'POST', url: string, body?: unknown) {
  const csrf = `csrf-${email}`;
  const token = await createSessionToken(email, SECRET, csrf);
  return new Request(url, {
    method,
    headers: {
      Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      ...(method !== 'GET' ? { 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' } : {}),
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
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM arrepentimiento_notificaciones WHERE tipo = 'arrepentimiento_recibido'").get()?.n, 1);
  const outbox = String(sqlite.prepare("SELECT payload_json FROM integration_outbox WHERE event_type = 'arrepentimiento.notificacion_pendiente'").get()?.payload_json);
  assert.doesNotMatch(outbox, /guest@example|Quiero revocar/);
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
    estado_actual: 'recibida', estado: 'resuelta', nota_interna: 'Solicitud verificada',
    mensaje_cliente: 'La solicitud fue verificada y resuelta.',
  });
  assert.equal((await actualizarAdmin({ request: patchViewer, env, params: { id } })).status, 403);

  const patchEditor = await requestAdmin(env, 'editor@test', 'PATCH', `https://test/api/v1/admin/arrepentimientos/${id}`, {
    estado_actual: 'recibida', estado: 'en_revision', nota_interna: 'Verificación iniciada',
    mensaje_cliente: 'Comenzamos a revisar tu solicitud.',
  });
  const actualizada = await actualizarAdmin({ request: patchEditor, env, params: { id } });
  assert.equal(actualizada.status, 200);
  assert.equal((await actualizada.json() as any).data.estado, 'en_revision');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM auditoria_admin WHERE accion = 'resolver_solicitud_arrepentimiento'").get()?.n, 1);

  const repetida = await requestAdmin(env, 'editor@test', 'PATCH', `https://test/api/v1/admin/arrepentimientos/${id}`, {
    estado_actual: 'recibida', estado: 'en_revision', nota_interna: 'Repetición segura',
    mensaje_cliente: 'Seguimos revisando la solicitud.',
  });
  assert.equal((await actualizarAdmin({ request: repetida, env, params: { id } })).status, 409);
  sqlite.close();
});

test('consulta el estado con código y email sin exponer datos de terceros', async () => {
  const { sqlite, env } = base();
  const creada = await publica(env, 'withdrawal-qa-status-0001');
  const codigo = (await creada.json() as any).data.solicitud.codigo;
  const correcta = await consultarPublica({
    request: new Request(`https://test/api/v1/public/arrepentimientos?codigo=${codigo}&email=guest%40example.test`, {
      headers: { 'CF-Connecting-IP': '203.0.113.11' },
    }), env,
  });
  assert.equal(correcta.status, 200);
  const body: any = await correcta.json();
  assert.deepEqual(Object.keys(body.data.solicitud).sort(), ['actualizada_at', 'codigo', 'estado', 'mensaje', 'recibida_at']);

  const incorrecta = await consultarPublica({
    request: new Request(`https://test/api/v1/public/arrepentimientos?codigo=${codigo}&email=otro%40example.test`, {
      headers: { 'CF-Connecting-IP': '203.0.113.12' },
    }), env,
  });
  assert.equal(incorrecta.status, 404);
  assert.equal((await incorrecta.json() as any).error.codigo, 'SOLICITUD_NO_ENCONTRADA');
  sqlite.close();
});

test('n8n reclama el email y confirma la entrega sin filtrar PII al outbox', async () => {
  const { sqlite, env } = base();
  await publica(env, 'withdrawal-qa-email-0001', { idioma: 'en' });
  const uid = String(sqlite.prepare('SELECT notificacion_uid FROM arrepentimiento_notificaciones').get()?.notificacion_uid);
  const headers = {
    'Content-Type': 'application/json',
    'X-Integration-Id': 'n8n',
    'X-Service-Secret': env.N8N_INBOUND_SECRET,
  };
  const claim = await entregarNotificacion({ request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
    method: 'POST', headers, body: JSON.stringify({ accion: 'reclamar', notificacion_uid: uid }),
  }), env });
  assert.equal(claim.status, 200);
  const entrega: any = (await claim.json()).data;
  assert.equal(entrega.destinatario, 'guest@example.test');
  assert.match(entrega.asunto, /We received/);

  const resultado = await entregarNotificacion({ request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
    method: 'POST', headers, body: JSON.stringify({
      accion: 'resultado', notificacion_uid: uid, claim_uid: entrega.claim_uid,
      delivery_uid: entrega.delivery_uid, resultado: 'entregada',
    }),
  }), env });
  assert.equal(resultado.status, 200);
  const duplicado = await entregarNotificacion({ request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
    method: 'POST', headers, body: JSON.stringify({
      accion: 'resultado', notificacion_uid: uid, claim_uid: entrega.claim_uid,
      delivery_uid: entrega.delivery_uid, resultado: 'entregada',
    }),
  }), env });
  assert.equal(duplicado.status, 200);
  assert.equal(sqlite.prepare('SELECT estado FROM arrepentimiento_notificaciones').get()?.estado, 'entregada');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM arrepentimiento_notificacion_intentos').get()?.n, 1);
  sqlite.close();
});

test('una entrega agotada queda visible y admite reproceso administrativo auditado', async () => {
  const { sqlite, env } = base();
  await publica(env, 'withdrawal-qa-dead-letter-0001');
  const uid = String(sqlite.prepare('SELECT notificacion_uid FROM arrepentimiento_notificaciones').get()?.notificacion_uid);
  const headers = {
    'Content-Type': 'application/json',
    'X-Integration-Id': 'n8n',
    'X-Service-Secret': env.N8N_INBOUND_SECRET,
  };
  const claim = await entregarNotificacion({ request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
    method: 'POST', headers, body: JSON.stringify({ accion: 'reclamar', notificacion_uid: uid }),
  }), env });
  assert.equal(claim.status, 200, await claim.clone().text());
  const entrega: any = (await claim.json()).data;
  await entregarNotificacion({ request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
    method: 'POST', headers, body: JSON.stringify({
      accion: 'resultado', notificacion_uid: uid, claim_uid: entrega.claim_uid,
      delivery_uid: entrega.delivery_uid, resultado: 'dead_letter', error_code: 'SMTP_TIMEOUT',
    }),
  }), env });
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, last_error_code FROM arrepentimiento_notificaciones
  `).get() }, { estado: 'dead_letter', last_error_code: 'SMTP_TIMEOUT' });

  const request = await requestAdmin(
    env, 'editor@test', 'POST',
    'https://test/api/v1/admin/arrepentimientos/notificaciones/reprocesar',
    { notificacion_uid: uid, motivo: 'Proveedor de correo recuperado.' }
  );
  const response = await reprocesarAdmin({ request, env });
  assert.equal(response.status, 200);
  assert.equal(sqlite.prepare('SELECT estado FROM arrepentimiento_notificaciones').get()?.estado, 'pendiente');
  assert.equal(sqlite.prepare('SELECT estado FROM integration_outbox WHERE event_id = ?').get(uid)?.estado, 'pending');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM auditoria_admin WHERE accion = 'reprocesar_notificacion_arrepentimiento'").get()?.n, 1);
  sqlite.close();
});

test('rechaza comandos inválidos y sólo reprocesa entregas agotadas', async () => {
  const { sqlite, env } = base();
  await publica(env, 'withdrawal-qa-validation-0001');
  const uid = String(sqlite.prepare('SELECT notificacion_uid FROM arrepentimiento_notificaciones').get()?.notificacion_uid);
  const headers = {
    'Content-Type': 'application/json',
    'X-Integration-Id': 'n8n',
    'X-Service-Secret': env.N8N_INBOUND_SECRET,
  };
  const invocar = (body: unknown) => entregarNotificacion({
    request: new Request('https://test/api/v1/integrations/arrepentimientos/notificaciones', {
      method: 'POST', headers, body: JSON.stringify(body),
    }),
    env,
  });

  assert.equal((await invocar({ accion: 'desconocida' })).status, 400);
  assert.equal((await invocar({ accion: 'reclamar', notificacion_uid: '' })).status, 400);
  assert.equal((await invocar({ accion: 'resultado', resultado: 'omitida' })).status, 400);
  assert.equal((await invocar({ accion: 'resultado', resultado: 'retry' })).status, 400);

  const claim = await invocar({ accion: 'reclamar', notificacion_uid: uid });
  const entrega: any = (await claim.json()).data;
  const segundoClaim = await invocar({ accion: 'reclamar', notificacion_uid: uid });
  assert.equal(segundoClaim.status, 409);

  const retry = await invocar({
    accion: 'resultado',
    notificacion_uid: uid,
    claim_uid: entrega.claim_uid,
    delivery_uid: entrega.delivery_uid,
    resultado: 'retry',
    error_code: 'detalle privado no permitido',
  });
  assert.equal(retry.status, 200);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, last_error_code, next_attempt_at IS NOT NULL AS programada
    FROM arrepentimiento_notificaciones
  `).get() }, { estado: 'pendiente', last_error_code: 'EMAIL_DELIVERY_ERROR', programada: 1 });

  const requestInvalido = await requestAdmin(
    env, 'editor@test', 'POST',
    'https://test/api/v1/admin/arrepentimientos/notificaciones/reprocesar',
    { notificacion_uid: uid, motivo: 'corto' }
  );
  assert.equal((await reprocesarAdmin({ request: requestInvalido, env })).status, 400);

  const requestNoAgotada = await requestAdmin(
    env, 'editor@test', 'POST',
    'https://test/api/v1/admin/arrepentimientos/notificaciones/reprocesar',
    { notificacion_uid: uid, motivo: 'La entrega todavía no está agotada.' }
  );
  assert.equal((await reprocesarAdmin({ request: requestNoAgotada, env })).status, 409);
  sqlite.close();
});
