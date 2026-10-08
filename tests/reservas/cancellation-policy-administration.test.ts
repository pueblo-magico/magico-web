import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  crearBorradorPoliticaCancelacion,
  publicarPoliticaCancelacion,
  resolverExcepcionPoliticaReserva,
  solicitarExcepcionPoliticaReserva,
} from '../../functions/_application/reservas/gestionarPoliticasCancelacion.ts';
import type { BorradorPoliticaCancelacion } from '../../functions/_domain/reservas/refundPolicies.ts';
import { D1RegistroAuditoriaReservas } from '../../functions/_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioExcepcionesPoliticaReserva } from '../../functions/_infrastructure/d1/D1RepositorioExcepcionesPoliticaReserva.ts';
import { D1RepositorioPoliticasCancelacion } from '../../functions/_infrastructure/d1/D1RepositorioPoliticasCancelacion.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import {
  onRequestGet as listarPoliticas,
  onRequestPost as gestionarPoliticas,
} from '../../functions/api/admin/politicas-reserva.ts';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  class Statement {
    values: unknown[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
    bind(...values: unknown[]) { this.values = values; return this; }
    async first() { return sqlite.prepare(this.query).get(...this.values as any[]) as Record<string, unknown> | null; }
    async all() { return { results: sqlite.prepare(this.query).all(...this.values as any[]) as Record<string, unknown>[] }; }
    async run() { return sqlite.prepare(this.query).run(...this.values as any[]); }
  }
  const db = {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => ({
          success: true,
          results: sqlite.prepare(statement.query).all(...statement.values as any[]) as Record<string, unknown>[],
        }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { sqlite, db };
}

const borrador: BorradorPoliticaCancelacion = {
  codigo: 'reservas-general',
  nombre: 'Política QA 2027',
  vigenciaDesde: '2027-01-01T00:00:00.000Z',
  reglas: [
    { horasMinimasAntes: 0, porcentajeDevolucionBps: 0 },
    { horasMinimasAntes: 48, porcentajeDevolucionBps: 5_000 },
  ],
};

test('crea, publica y audita una política sin modificar el snapshot pendiente existente', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioPoliticasCancelacion(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const creada = await crearBorradorPoliticaCancelacion(borrador, 'admin@test', repositorio, auditoria);
  assert.equal(creada.version, 2);
  assert.equal(creada.estado, 'borrador');

  const publicada = await publicarPoliticaCancelacion(creada.id, 'admin@test', repositorio, auditoria);
  assert.equal(publicada.estado, 'publicada');
  assert.deepEqual(
    sqlite.prepare("SELECT accion FROM auditoria_admin WHERE entidad_tipo = 'politica_cancelacion' ORDER BY id")
      .all().map(fila => fila.accion),
    ['crear_borrador_politica_cancelacion', 'publicar_politica_cancelacion']
  );
  assert.throws(
    () => sqlite.prepare("UPDATE politicas_cancelacion SET nombre = 'Mutada' WHERE id = ?").run(creada.id),
    /published cancellation policies are immutable/
  );
  sqlite.close();
});

test('rechaza reglas ambiguas o porcentajes fuera de rango antes de escribir', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioPoliticasCancelacion(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  for (const reglas of [
    [{ horasMinimasAntes: 24, porcentajeDevolucionBps: 5_000 }, { horasMinimasAntes: 24, porcentajeDevolucionBps: 0 }],
    [{ horasMinimasAntes: 0, porcentajeDevolucionBps: 10_001 }],
    [],
  ]) {
    await assert.rejects(
      () => crearBorradorPoliticaCancelacion({ ...borrador, reglas }, 'admin@test', repositorio, auditoria),
      /inválida/
    );
  }
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM politicas_cancelacion WHERE estado = 'borrador'").get()?.n, 0);

  await assert.rejects(
    () => crearBorradorPoliticaCancelacion(
      { ...borrador, vigenciaDesde: '2027-02-30T00:00:00.000Z' },
      'admin@test', repositorio, auditoria
    ),
    /inválida/
  );
  sqlite.close();
});

test('solicita y resuelve una excepción una sola vez con evento y auditoría', async () => {
  const { sqlite, db } = database();
  const reservaId = Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA excepción', 1, '2027-01-10', '2027-01-12', 2, 100, 'confirmada', 'QA')
    RETURNING id
  `).get()?.id);
  const repositorio = new D1RepositorioExcepcionesPoliticaReserva(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);

  const solicitada = await solicitarExcepcionPoliticaReserva({
    reservaId, tipo: 'devolucion', montoDevolucionCentavos: 5_000,
    motivo: 'Excepción comercial aprobable',
  }, 'admin@test', repositorio, auditoria);
  assert.equal(solicitada.estado, 'solicitada');

  const aprobada = await resolverExcepcionPoliticaReserva(
    solicitada.id, 'aprobada', 'super@test', repositorio, auditoria
  );
  assert.equal(aprobada.estado, 'aprobada');
  assert.equal(aprobada.resueltaPor, 'super@test');
  await assert.rejects(
    () => resolverExcepcionPoliticaReserva(
      solicitada.id, 'rechazada', 'super@test', repositorio, auditoria
    ),
    /ya fue resuelta/
  );
  assert.deepEqual(
    sqlite.prepare(`
      SELECT tipo FROM reserva_eventos
      WHERE reserva_id = ? AND tipo LIKE 'reserva.politica_excepcion_%' ORDER BY id
    `).all(reservaId).map(fila => fila.tipo),
    ['reserva.politica_excepcion_solicitada', 'reserva.politica_excepcion_resuelta']
  );
  assert.deepEqual(
    sqlite.prepare(`
      SELECT accion FROM auditoria_admin
      WHERE entidad_tipo = 'excepcion_politica_reserva' ORDER BY id
    `).all().map(fila => fila.accion),
    ['solicitar_excepcion_politica_reserva', 'aprobar_excepcion_politica_reserva']
  );
  sqlite.close();
});

test('el contrato administrativo exige CSRF y permiso exclusivo de políticas', async () => {
  const { sqlite, db } = database();
  sqlite.exec(`
    INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
      ('admin@test', 'x', 'super_admin'),
      ('editor@test', 'x', 'editor');
  `);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-politicas';
  const token = await createSessionToken('admin@test', secret, csrf);
  const cookie = `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const request = new Request('https://test/api/admin/politicas-reserva', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Cookie: cookie },
    body: JSON.stringify({
      accion: 'crear_borrador',
      politica: {
        codigo: borrador.codigo, nombre: borrador.nombre, vigencia_desde: borrador.vigenciaDesde,
        reglas: borrador.reglas.map(regla => ({
          horas_minimas_antes: regla.horasMinimasAntes,
          porcentaje_devolucion_bps: regla.porcentajeDevolucionBps,
        })),
      },
    }),
  });
  const env = { DB: db, SESSION_SECRET: secret };
  const creada = await gestionarPoliticas({ request, env });
  assert.equal(creada.status, 201);
  assert.equal((await creada.json() as any).politica.version, 2);

  const listada = await listarPoliticas({
    request: new Request('https://test/api/admin/politicas-reserva', { headers: { Cookie: cookie } }), env,
  });
  assert.equal(listada.status, 200);
  assert.equal((await listada.json() as any).politicas.length, 2);

  const editorToken = await createSessionToken('editor@test', secret, 'csrf-editor');
  const denegada = await listarPoliticas({
    request: new Request('https://test/api/admin/politicas-reserva', {
      headers: { Cookie: `pm_admin_session=${encodeURIComponent(editorToken)}` },
    }), env,
  });
  assert.equal(denegada.status, 403);
  sqlite.close();
});
