import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { rolTienePermiso } from '../../functions/_domain/reservas/adminPermissions.ts';
import { requirePermission, requireRole, tienePermiso } from '../../functions/_lib/authGuard.ts';
import {
  clearCsrfCookieHeader, clearSessionCookieHeader, createSessionToken, csrfCookieHeader,
  readCookie, sessionCookieHeader, verifySessionToken,
} from '../../functions/_lib/session.ts';
import { consumirLimite, respuestaLimite } from '../../functions/_interfaces/http/rateLimit.ts';
import { leerJsonSeguro, respuestaJsonInvalido } from '../../functions/_interfaces/http/requestSecurity.ts';
import { autenticarServicio } from '../../functions/_interfaces/http/serviceAuth.ts';
import { onRequestPost as datosPersonales } from '../../functions/api/admin/datos-personales.ts';

const SECRET = 'session-secret-seguro-de-al-menos-32-caracteres';

test('la matriz RBAC impide escalamiento y separa pagos, usuarios y PII', () => {
  assert.equal(rolTienePermiso('viewer', 'reservas.leer'), true);
  assert.equal(rolTienePermiso('viewer', 'reservas.editar'), false);
  assert.equal(rolTienePermiso('editor', 'reservas.cancelar'), true);
  assert.equal(rolTienePermiso('editor', 'reservas.pagos.gestionar'), false);
  assert.equal(rolTienePermiso('editor', 'reservas.tarifas.gestionar'), false);
  assert.equal(rolTienePermiso('editor', 'reservas.configuracion.leer'), true);
  assert.equal(rolTienePermiso('editor', 'reservas.configuracion.gestionar'), false);
  assert.equal(rolTienePermiso('super_admin', 'reservas.configuracion.gestionar'), true);
  assert.equal(rolTienePermiso('super_admin', 'reservas.tarifas.gestionar'), true);
  assert.equal(rolTienePermiso('editor', 'usuarios.gestionar'), false);
  assert.equal(rolTienePermiso('super_admin', 'datos_personales.anonimizar'), true);
});

test('la sesión firmada rechaza manipulación y CSRF ausente', async () => {
  const csrf = 'csrf-prueba';
  const token = await createSessionToken('viewer@test', SECRET, csrf);
  assert.equal((await verifySessionToken(token, SECRET))?.email, 'viewer@test');
  assert.equal(await verifySessionToken(`${token}x`, SECRET), null);
  assert.equal(await verifySessionToken('%%%..', SECRET), null);

  const env = {
    SESSION_SECRET: SECRET,
    DB: { prepare() { return { bind() { return this; }, async first() { return { email: 'viewer@test', rol: 'viewer', activo: 1 }; } }; } },
  };
  const cookie = `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const lectura = await requirePermission(new Request('https://test/api/admin/reservas', { headers: { Cookie: cookie } }), env, 'reservas.leer');
  assert.equal(lectura instanceof Response, false);
  const escalamiento = await requirePermission(new Request('https://test/api/admin/usuarios', { headers: { Cookie: cookie } }), env, 'usuarios.gestionar');
  assert.equal((escalamiento as Response).status, 403);
  const sinCsrf = await requirePermission(new Request('https://test/api/admin/reservas', { method: 'POST', headers: { Cookie: cookie } }), env, 'reservas.leer');
  assert.equal((sinCsrf as Response).status, 403);
  assert.equal((await requireRole(new Request('https://test', { headers: { Cookie: cookie } }), env, ['super_admin']) as Response).status, 403);
  assert.equal(tienePermiso({ email: 'viewer@test', rol: 'viewer' }, 'reservas.leer'), true);
  assert.equal(readCookie(new Request('https://test', { headers: { Cookie: cookie } }), 'pm_admin_csrf'), csrf);
  assert.match(sessionCookieHeader(token), /HttpOnly; Secure; SameSite=Strict/);
  assert.match(csrfCookieHeader(csrf), /Secure; SameSite=Strict/);
  assert.match(clearSessionCookieHeader(), /Max-Age=0/);
  assert.match(clearCsrfCookieHeader(), /Max-Age=0/);
});

test('las identidades de servicio tienen secretos y alcances mínimos', () => {
  const env = {
    MANYCHAT_INBOUND_SECRET: 'manychat-secret-seguro-123456',
    N8N_INBOUND_SECRET: 'n8n-secret-seguro-123456789',
    OUTBOX_DISPATCH_SECRET: 'outbox-secret-seguro-123456789',
  };
  assert.equal(autenticarServicio(
    'manychat', env.MANYCHAT_INBOUND_SECRET, env, 'reservas:disponibilidad'
  ), false);
  assert.equal(autenticarServicio(
    'manychat', env.MANYCHAT_INBOUND_SECRET, env, 'reservas:cotizar'
  ), false);
  assert.equal(autenticarServicio('manychat', env.MANYCHAT_INBOUND_SECRET, env, 'reservas:crear'), true);
  assert.equal(autenticarServicio('manychat', env.MANYCHAT_INBOUND_SECRET, env, 'reservas:leer'), false);
  assert.equal(autenticarServicio('manychat', 'incorrecto', env, 'reservas:crear'), false);
  assert.equal(autenticarServicio('manychat', '', {}, 'reservas:crear'), false);
  assert.equal(autenticarServicio(
    'n8n', env.N8N_INBOUND_SECRET, env, 'reservas:disponibilidad'
  ), true);
  assert.equal(autenticarServicio('n8n', env.N8N_INBOUND_SECRET, env, 'reservas:cotizar'), true);
  assert.equal(autenticarServicio('n8n', env.N8N_INBOUND_SECRET, env, 'reservas:crear'), true);
  assert.equal(autenticarServicio('n8n', env.N8N_INBOUND_SECRET, env, 'consultas:crear'), true);
  assert.equal(autenticarServicio(
    'outbox', env.OUTBOX_DISPATCH_SECRET, env, 'integraciones:despachar'
  ), true);
  assert.equal(autenticarServicio(
    'outbox', env.OUTBOX_DISPATCH_SECRET, env, 'reservas:crear'
  ), false);
});

test('la lectura JSON rechaza content type, arrays y cuerpos grandes', async () => {
  const valida = await leerJsonSeguro(new Request('https://test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"ok":true}',
  }));
  assert.deepEqual(valida, { ok: true });
  await assert.rejects(leerJsonSeguro(new Request('https://test', { method: 'POST', body: '{}' })), /CONTENT_TYPE/);
  await assert.rejects(leerJsonSeguro(new Request('https://test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]',
  })), /INVALID_JSON/);
  await assert.rejects(leerJsonSeguro(new Request('https://test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 'a'.repeat(100) }),
  }), 20), /BODY_TOO_LARGE/);
  assert.equal(respuestaJsonInvalido(new Error('BODY_TOO_LARGE')).status, 413);
  assert.equal(respuestaJsonInvalido(new Error('INVALID_JSON')).status, 400);
});

test('rate limiting persiste sólo un hash del sujeto', async () => {
  const binds: unknown[] = [];
  let cantidad = 0;
  const env = {
    RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
    DB: { prepare() { return { bind(...values: unknown[]) { binds.push(...values); return this; }, async first() { return { cantidad: ++cantidad }; } }; } },
  };
  const request = new Request('https://test', { headers: { 'CF-Connecting-IP': '203.0.113.9' } });
  assert.equal((await consumirLimite(request, env, 'prueba', 1, 60)).permitido, true);
  assert.equal((await consumirLimite(request, env, 'prueba', 1, 60)).permitido, false);
  assert.match(String(binds[0]), /^[a-f0-9]{64}$/);
  assert.equal(binds.includes('203.0.113.9'), false);
  assert.equal(respuestaLimite({ permitido: true, reintentarEn: 1 }), null);
  assert.equal(respuestaLimite({ permitido: false, reintentarEn: 9 })?.headers.get('Retry-After'), '9');
  assert.equal((await consumirLimite(request, { DB: env.DB }, 'sin-salt', 1, 60)).permitido, false);
  assert.equal((await consumirLimite(request, {}, 'sin-db', 1, 60)).permitido, false);
});

function d1(db: DatabaseSync) {
  return {
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...next: unknown[]) { values = next; return this; },
        async first() { return db.prepare(query).get(...values as any[]); },
        async run() { return db.prepare(query).run(...values as any[]); },
      };
    },
  };
}

test('la migración y el flujo PII exportan y anonimizan sin borrar información financiera', async () => {
  const db = new DatabaseSync(':memory:');
  for (let i = 1; i <= 4; i++) {
    const name = ['initial_reservas', 'normalize_reservation_core', 'accommodation_inventory', 'capacity_exceptions', 'security_rbac_pii'][i - 1];
    db.exec(readFileSync(new URL(`../../migrations/000${i}_${name}.sql`, import.meta.url), 'utf8'));
  }
  db.exec("INSERT INTO auditoria_admin (email, accion, detalle) VALUES ('admin@test', 'legacy', 'Ana ana@test')");
  db.exec(readFileSync(new URL('../../migrations/0005_security_rbac_pii.sql', import.meta.url), 'utf8'));
  assert.equal(db.prepare("SELECT detalle FROM auditoria_admin WHERE accion = 'legacy'").get()?.detalle, null);
  db.exec(`
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('admin@test', 'x', 'super_admin');
    INSERT INTO reservas (cliente_nombre, cliente_telefono, cliente_email, alojamiento_id,
      fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena, estado, manychat_user_id)
    VALUES ('Ana', '+54911', 'ana@test', 1, '2026-11-10', '2026-11-12', 2, 1000, 250, 'confirmada', 'mc-1');
  `);
  const reservaId = Number(db.prepare("SELECT id FROM reservas WHERE cliente_nombre = 'Ana'").get()?.id);
  const csrf = 'csrf-pii';
  const token = await createSessionToken('admin@test', SECRET, csrf);
  const request = (accion: string, motivo: string) => new Request('https://test/api/admin/datos-personales', {
    method: 'POST',
    headers: {
      Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
      'X-CSRF-Token': csrf,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accion, reserva_id: reservaId, motivo }),
  });
  const env = { DB: d1(db), SESSION_SECRET: SECRET };
  const exportada = await datosPersonales({ request: request('exportar', 'Pedido verificable del huésped'), env });
  assert.equal(exportada.status, 200);
  assert.equal((await exportada.json() as any).reserva.cliente_email, 'ana@test');
  const anonimizada = await datosPersonales({ request: request('anonimizar', 'Retención cumplida y solicitud validada'), env });
  assert.equal(anonimizada.status, 200);
  const row = db.prepare('SELECT cliente_nombre, cliente_email, monto_total, monto_sena FROM reservas WHERE id = ?').get(reservaId);
  assert.deepEqual({ ...row }, { cliente_nombre: 'Huésped anonimizado', cliente_email: null, monto_total: 1000, monto_sena: 250 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM solicitudes_datos_personales').get()?.n, 2);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM auditoria_admin WHERE detalle IS NOT NULL").get()?.n, 0);
  db.exec(readFileSync(new URL('../../scripts/reservas/verificar-seguridad.sql', import.meta.url), 'utf8'));
  db.close();
});
