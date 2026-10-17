import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { D1RepositorioAplicacionesApi } from '../../functions/_infrastructure/d1/D1RepositorioAplicacionesApi.ts';
import { registrarUsoAplicacionApi } from '../../functions/_infrastructure/d1/D1RegistroUsoAplicacionApi.ts';
import { onRequestGet as listarAplicaciones } from '../../functions/api/v1/admin/integraciones/aplicaciones.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';

function baseCompleta() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  class Statement {
    private values: SQLInputValue[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
    bind(...values: unknown[]) { this.values = values as SQLInputValue[]; return this; }
    async first() { return sqlite.prepare(this.query).get(...this.values) as Record<string, unknown> || null; }
    async all() { return { results: sqlite.prepare(this.query).all(...this.values) as Record<string, unknown>[] }; }
    async run() { return sqlite.prepare(this.query).run(...this.values); }
  }
  const db = { prepare(query: string) { return new Statement(query); } };
  return { sqlite, db };
}

test('registra aplicaciones conocidas y acumula uso autenticado por endpoint sin secretos', async () => {
  const { sqlite, db } = baseCompleta();
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM api_applications').get()?.total, 7);

  assert.equal(await registrarUsoAplicacionApi(db, 'n8n', 'GET', '/api/v1/integrations/reservas/disponibilidad'), true);
  assert.equal(await registrarUsoAplicacionApi(db, 'n8n', 'GET', '/api/v1/integrations/reservas/disponibilidad'), true);
  const registro = await new D1RepositorioAplicacionesApi(db).listar();
  const uso = registro.usos.find(item => item.aplicacionCodigo === 'n8n');
  assert.equal(uso?.requestCount, 2);
  assert.equal(uso?.method, 'GET');
  assert.equal(uso?.endpoint, '/api/v1/integrations/reservas/disponibilidad');
  assert.ok(uso?.firstUsedAt);
  assert.ok(uso?.lastUsedAt);
  sqlite.close();
});

test('sólo super admin ve registro, configuración y fechas sin valores secretos', async () => {
  const { sqlite, db } = baseCompleta();
  sqlite.exec(`INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
    ('admin@test', 'x', 'super_admin'), ('editor@test', 'x', 'editor')`);
  await registrarUsoAplicacionApi(db, 'n8n', 'POST', '/api/v1/integrations/consultas');

  const sessionSecret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-api-apps';
  const tokenAdmin = await createSessionToken('admin@test', sessionSecret, csrf);
  const tokenEditor = await createSessionToken('editor@test', sessionSecret, csrf);
  const request = (token: string) => new Request('https://test/api/v1/admin/integraciones/aplicaciones', {
    headers: { Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}` },
  });
  const env = { DB: db, SESSION_SECRET: sessionSecret, N8N_INBOUND_SECRET: 'n8n-secret-with-at-least-24-characters' };

  assert.equal((await listarAplicaciones({ request: request(tokenEditor), env })).status, 403);
  const response = await listarAplicaciones({ request: request(tokenAdmin), env });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.secretos_expuestos, false);
  assert.equal(body.data.aplicaciones.length, 7);
  const n8n = body.data.aplicaciones.find((item: any) => item.codigo === 'n8n');
  assert.equal(n8n.configurada, true);
  assert.ok(n8n.registrado_at);
  assert.equal(n8n.request_count, 1);
  assert.equal(n8n.endpoints.find((item: any) => item.path === '/api/v1/integrations/consultas').request_count, 1);
  assert.doesNotMatch(JSON.stringify(body), /n8n-secret-with-at-least-24-characters|N8N_INBOUND_SECRET/);
  sqlite.close();
});
