import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import {
  consultarReservaAdmin,
  listarReservasAdmin,
} from '../../functions/_application/reservas/consultarReservasAdmin.ts';
import { D1RepositorioAsignacionInventario } from '../../functions/_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { D1RepositorioGestionReservasAdmin } from '../../functions/_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { D1RepositorioHistorialReserva } from '../../functions/_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { onRequestGet as listarAdmin } from '../../functions/api/v1/admin/reservas/index.ts';

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

function crearReserva(sqlite: DatabaseSync, indice: number): number {
  return Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES (?, ?, ?, ?, ?, 2, 100, ?, ?)
    RETURNING id
  `).get(
    `Titular ${indice}`, `titular${indice}@example.com`, indice % 2 ? 1 : 2,
    `2099-11-${String(indice).padStart(2, '0')}`,
    `2099-11-${String(indice + 1).padStart(2, '0')}`,
    indice % 3 ? 'confirmada' : 'pendiente', indice % 2 ? 'Web' : 'Admin'
  )?.id);
}

test('lista reservas con paginación estable y filtros combinables', async () => {
  const sqlite = baseCompleta();
  for (let indice = 1; indice <= 12; indice++) crearReserva(sqlite, indice);
  const repositorio = new D1RepositorioGestionReservasAdmin(d1(sqlite));

  const pagina = await listarReservasAdmin({ pagina: 2, limite: 5 }, repositorio);
  assert.equal(pagina.items.length, 5);
  assert.equal(pagina.total, 12);
  assert.equal(pagina.totalPaginas, 3);
  const filtrada = await listarReservasAdmin({
    pagina: 1, limite: 20, origen: 'Web', espacioCodigo: 'domo-1', titular: 'Titular',
  }, repositorio);
  assert.equal(filtrada.total, 6);
  assert.ok(filtrada.items.every(item => item.canalOrigen === 'Web' && item.espacioCodigo === 'domo-1'));
  sqlite.close();
});

test('el detalle reúne estadía, asignación, pagos, eventos y excepciones', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite, 1);
  const database = d1(sqlite);
  const detalle = await consultarReservaAdmin(
    reservaId,
    new D1RepositorioGestionReservasAdmin(database),
    new D1RepositorioHistorialReserva(database),
    new D1RepositorioAsignacionInventario(database)
  );

  assert.equal(detalle.reserva.id, reservaId);
  assert.equal(detalle.reserva.estadias.length, 1);
  assert.equal(detalle.asignacion.reservaId, reservaId);
  assert.ok(detalle.historial.eventos.some(evento => evento.tipo === 'reserva.creada_legacy'));
  assert.deepEqual(detalle.reserva.excepciones, []);
  sqlite.close();
});

test('rechaza filtros inválidos antes de consultar el repositorio', () => {
  let consultado = false;
  assert.throws(
    () => listarReservasAdmin({ pagina: 0, limite: 500 }, {
      async listar() { consultado = true; throw new Error('no'); },
      async obtenerDetalle() { return null; },
    }),
    /paginación es inválida/
  );
  assert.equal(consultado, false);
});

test('el listado v1 exige sesión administrativa', async () => {
  const response = await listarAdmin({
    request: new Request('https://test/api/v1/admin/reservas?pagina=1'),
    env: { SESSION_SECRET: 'session-secret-seguro-de-al-menos-32-caracteres' },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado.' });
});
