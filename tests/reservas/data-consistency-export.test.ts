import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import {
  serializarExportacionReservas,
  type FilaExportacionReserva,
} from '../../functions/_domain/reservas/adminReservationExport.ts';
import { calcularMetricasPanelReservas } from '../../functions/_domain/reservas/adminMetrics.ts';
import { fechaOperativaCordoba } from '../../functions/_domain/reservas/operationalDate.ts';
import { normalizarEstadoReserva, normalizarTipoEstadia } from '../../functions/_domain/reservas/reservationCatalog.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import { onRequestGet as exportarReservas } from '../../functions/api/v1/admin/reservas/exportar.ts';

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
  };
}

test('calcula el día operativo de Córdoba sin desplazarlo por UTC', () => {
  assert.equal(fechaOperativaCordoba(new Date('2026-10-06T02:59:59.000Z')), '2026-10-05');
  assert.equal(fechaOperativaCordoba(new Date('2026-10-06T03:00:00.000Z')), '2026-10-06');

  const reserva = {
    id: 1, version: 1, cliente_nombre: 'QA', cliente_telefono: null, cliente_email: null,
    alojamiento_id: 1, alojamiento_nombre: 'Domo 1', alojamiento_tipo: 'domo',
    fecha_checkin: '2026-10-05', fecha_checkout: '2026-10-06', cantidad_personas: 2,
    monto_total: 100, monto_sena: 30, estado: 'confirmada', unidad_asignada: null,
    canal_origen: 'Web', mp_preference_id: null, mp_payment_id: null,
    manychat_user_id: null, created_at: '2026-10-01T00:00:00Z',
  };
  const metricas = calcularMetricasPanelReservas(
    [reserva], [], { total: 0, confirmadas: 0 }, 3,
    new Date('2026-10-06T02:59:59.000Z')
  );
  assert.equal(metricas.checkins_hoy, 1);
  assert.equal(metricas.checkouts_hoy, 0);
});

test('normaliza catálogos legacy y rechaza valores ambiguos', () => {
  assert.equal(normalizarEstadoReserva('pendiente'), 'pendiente_pago');
  assert.equal(normalizarEstadoReserva('confirmada'), 'confirmada');
  assert.equal(normalizarTipoEstadia('Voluntario'), 'voluntario');
  assert.throws(() => normalizarEstadoReserva('pagada'), /estado es inválido/);
  assert.throws(() => normalizarTipoEstadia('invitado'), /tipo de estadía es inválido/);
});

test('el reporte de consistencia se puede ejecutar sin escribir datos', () => {
  const sqlite = baseCompleta();
  sqlite.exec('CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
  sqlite.exec(readFileSync(
    new URL('../../scripts/reservas/verificar-consistencia.sql', import.meta.url),
    'utf8'
  ));
  assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM reservas').get()?.total, 0);
  sqlite.close();
});

test('el CSV omite PII por defecto y neutraliza fórmulas', () => {
  const fila: FilaExportacionReserva = {
    codigo: '=RES-1', titular: 'Persona QA', telefono: '+54', email: 'qa@example.com',
    fechaCheckin: '2027-01-01', fechaCheckout: '2027-01-02', cantidadPersonas: 2,
    estado: 'confirmada', tipoEstadia: 'huesped', canalOrigen: 'Web',
    espacioCodigo: 'domo-1', espacioNombre: 'Domo 1', modalidad: 'privada', moneda: 'ARS',
    montoTotalCentavos: 100_000, montoSenaCentavos: 30_000,
  };
  const minimizado = serializarExportacionReservas([fila], false);
  assert.doesNotMatch(minimizado, /titular|telefono|email|Persona QA|qa@example/);
  assert.match(minimizado, /'=RES-1/);
  assert.match(minimizado, /70000/);
  const conPii = serializarExportacionReservas([fila], true);
  assert.match(conPii, /titular,telefono,email/);
  assert.match(conPii, /Persona QA/);
});

test('la exportación v1 aplica permiso, filtros, minimización y auditoría', async () => {
  const sqlite = baseCompleta();
  sqlite.exec(`
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
      ('admin@test', 'x', 'super_admin'), ('editor@test', 'x', 'editor');
    INSERT INTO reservas (
      cliente_nombre, cliente_telefono, cliente_email, alojamiento_id,
      fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena,
      estado, canal_origen, tipo_estadia
    ) VALUES
      ('Exportada QA', '+54 351', 'qa@example.com', 1,
       '2027-06-10', '2027-06-12', 2, 1500, 450, 'confirmada', 'Web', 'huesped'),
      ('No incluida', NULL, NULL, 2,
       '2027-07-10', '2027-07-12', 2, 1000, 300, 'cancelada', 'Admin', 'huesped');
  `);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const tokenAdmin = await createSessionToken('admin@test', secret, 'csrf-admin');
  const tokenEditor = await createSessionToken('editor@test', secret, 'csrf-editor');
  const env = { DB: d1(sqlite), SESSION_SECRET: secret };
  const cookie = (token: string) => `pm_admin_session=${encodeURIComponent(token)}`;

  const denegada = await exportarReservas({
    request: new Request('https://test/api/v1/admin/reservas/exportar', {
      headers: { Cookie: cookie(tokenEditor) },
    }), env,
  });
  assert.equal(denegada.status, 403);

  const minimizada = await exportarReservas({
    request: new Request('https://test/api/v1/admin/reservas/exportar?estado=confirmada', {
      headers: { Cookie: cookie(tokenAdmin) },
    }), env,
  });
  assert.equal(minimizada.status, 200);
  assert.equal(minimizada.headers.get('X-Export-Count'), '1');
  assert.equal(minimizada.headers.get('X-Export-Includes-PII'), 'false');
  assert.equal(minimizada.headers.get('Cache-Control'), 'no-store, private');
  const csvMinimizado = await minimizada.text();
  assert.doesNotMatch(csvMinimizado, /Exportada QA|qa@example.com/);
  assert.match(csvMinimizado, /confirmada/);

  const conPii = await exportarReservas({
    request: new Request('https://test/api/v1/admin/reservas/exportar?estado=pendiente&incluir_pii=true', {
      headers: { Cookie: cookie(tokenAdmin) },
    }), env,
  });
  assert.equal(conPii.status, 200);
  assert.equal(conPii.headers.get('X-Export-Count'), '0');
  assert.equal(conPii.headers.get('X-Export-Includes-PII'), 'true');

  const invalida = await exportarReservas({
    request: new Request('https://test/api/v1/admin/reservas/exportar?incluir_pii=quizas', {
      headers: { Cookie: cookie(tokenAdmin) },
    }), env,
  });
  assert.equal(invalida.status, 400);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM auditoria_admin WHERE accion = 'exportar_reservas'").get()?.n, 2);
  sqlite.close();
});
