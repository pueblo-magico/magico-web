import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import {
  consultarReservaAdmin,
  listarReservasAdmin,
} from '../../functions/_application/reservas/consultarReservasAdmin.ts';
import {
  cambiarEstadoReservaAdmin,
  crearReservaAdmin,
  editarReservaAdmin,
} from '../../functions/_application/reservas/gestionarReservasAdmin.ts';
import { D1RepositorioAsignacionInventario } from '../../functions/_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { D1RepositorioGestionReservasAdmin } from '../../functions/_infrastructure/d1/D1RepositorioGestionReservasAdmin.ts';
import { D1RepositorioHistorialReserva } from '../../functions/_infrastructure/d1/D1RepositorioHistorialReserva.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import {
  onRequestGet as listarAdmin,
  onRequestPost as crearAdmin,
} from '../../functions/api/v1/admin/reservas/index.ts';
import { onRequestPatch as editarAdmin } from '../../functions/api/v1/admin/reservas/[id]/index.ts';
import { onRequestPost as cambiarEstadoAdmin } from '../../functions/api/v1/admin/reservas/[id]/estado.ts';
import { onRequestGet as consultarPanelAdmin } from '../../functions/api/v1/admin/reservas/panel.ts';

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
  assert.equal(pagina.items[0].montoTotalCentavos, 10_000);
  assert.ok(pagina.items[0].alojamientoId > 0);
  assert.ok(pagina.items.every(item => item.estado === item.estadoFlujo && item.estado !== 'pendiente'));
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
      async crear() { throw new Error('no'); },
      async editar() { return null; },
      async cambiarEstado() { return null; },
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

test('crea una reserva administrativa confirmada y rechaza sobreventa', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioGestionReservasAdmin(d1(sqlite));
  const entrada = {
    clienteNombre: 'Reserva Admin', clienteTelefono: null, clienteEmail: 'admin@example.com',
    fechaCheckin: '2099-12-10', fechaCheckout: '2099-12-12', cantidadPersonas: 2,
    espacioCodigo: 'refugio-habitacion-4', modalidad: 'privada' as const,
    canalOrigen: 'Teléfono', montoTotalCentavos: 100_000, montoSenaCentavos: 30_000,
  };
  const creada = await crearReservaAdmin(entrada, 'qa-admin@example.com', 'req-crear-1', repositorio);

  assert.equal(creada.estadoFlujo, 'confirmada');
  assert.equal(creada.espacioCodigo, 'refugio-habitacion-4');
  assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM ocupacion_reserva_noches
    WHERE estado = 'confirmada'`).get()?.n, 2);
  await assert.rejects(
    crearReservaAdmin(entrada, 'qa-admin@example.com', 'req-crear-2', repositorio),
    /no está disponible/
  );
  sqlite.close();
});

test('edita con versión optimista y rechaza una escritura desactualizada', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite, 1);
  const repositorio = new D1RepositorioGestionReservasAdmin(d1(sqlite));
  const version = Number(sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(reservaId)?.version);
  const editada = await editarReservaAdmin({
    reservaId, expectedVersion: version, cambios: { clienteTelefono: '+54 351 555 0000' },
    actorEmail: 'qa-admin@example.com', correlationId: 'req-edit-1',
  }, repositorio);

  assert.equal(editada.version, version + 1);
  await assert.rejects(editarReservaAdmin({
    reservaId, expectedVersion: version, cambios: { clienteTelefono: '+54 351 555 9999' },
    actorEmail: 'qa-admin@example.com', correlationId: 'req-edit-stale',
  }, repositorio), /cambió/);
  assert.equal(sqlite.prepare('SELECT cliente_telefono FROM reservas WHERE id = ?').get(reservaId)?.cliente_telefono, '+54 351 555 0000');
  sqlite.close();
});

test('confirma y cancela sólo transiciones válidas con motivo auditado', async () => {
  const sqlite = baseCompleta();
  const reservaId = crearReserva(sqlite, 3);
  const repositorio = new D1RepositorioGestionReservasAdmin(d1(sqlite));
  const version = Number(sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(reservaId)?.version);
  const confirmada = await cambiarEstadoReservaAdmin({
    reservaId, expectedVersion: version, accion: 'confirmar', motivo: 'Pago verificado manualmente',
    actorEmail: 'qa-admin@example.com', correlationId: 'req-confirmar',
  }, repositorio);
  const cancelada = await cambiarEstadoReservaAdmin({
    reservaId, expectedVersion: confirmada.version, accion: 'cancelar', motivo: 'Solicitud expresa del huésped',
    actorEmail: 'qa-admin@example.com', correlationId: 'req-cancelar',
  }, repositorio);

  assert.equal(cancelada.estadoFlujo, 'cancelada');
  assert.deepEqual(sqlite.prepare(`SELECT accion FROM operaciones_reserva_admin
    WHERE reserva_id = ? ORDER BY id`).all(reservaId).map(row => row.accion), ['confirmar', 'cancelar']);
  assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM auditoria_admin
    WHERE entidad_id = ? AND motivo IS NOT NULL`).get(String(reservaId))?.n, 2);
  await assert.rejects(cambiarEstadoReservaAdmin({
    reservaId, expectedVersion: cancelada.version, accion: 'vencer', motivo: 'Intento inválido',
    actorEmail: 'qa-admin@example.com', correlationId: 'req-vencer',
  }, repositorio), /transición no es válida/);
  sqlite.close();
});

test('el contrato v1 crea, edita y cancela con sesión, CSRF y versión optimista', async () => {
  const sqlite = baseCompleta();
  const database = d1(sqlite);
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('editor@test', 'x', 'editor')");
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-reservas-v1';
  const token = await createSessionToken('editor@test', secret, csrf);
  const cookie = `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Cookie: cookie };
  const env = { DB: database, SESSION_SECRET: secret };

  const creada = await crearAdmin({
    request: new Request('https://test/api/v1/admin/reservas', {
      method: 'POST', headers, body: JSON.stringify({
        cliente_nombre: 'Contrato Admin', cliente_telefono: '+54 351 111 2222',
        cliente_email: 'contrato@example.com', fecha_checkin: '2099-12-20',
        fecha_checkout: '2099-12-22', cantidad_personas: 2,
        espacio_codigo: 'domo-1', modalidad: 'privada', canal_origen: 'Teléfono',
        monto_total_centavos: 150_000, monto_sena_centavos: 45_000,
      }),
    }), env,
  });
  assert.equal(creada.status, 201);
  const reservaCreada = (await creada.json() as any).data;

  const panel = await consultarPanelAdmin({
    request: new Request('https://test/api/v1/admin/reservas/panel', { headers: { Cookie: cookie } }), env,
  });
  assert.equal(panel.status, 200);
  assert.ok((await panel.json() as any).data.alojamientos.length >= 3);

  const editada = await editarAdmin({
    request: new Request(`https://test/api/v1/admin/reservas/${reservaCreada.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({
        expected_version: reservaCreada.version,
        cambios: { cliente_telefono: '+54 351 999 0000' },
      }),
    }), env, params: { id: String(reservaCreada.id) },
  });
  assert.equal(editada.status, 200);
  const reservaEditada = (await editada.json() as any).data;

  const sinCsrf = await cambiarEstadoAdmin({
    request: new Request(`https://test/api/v1/admin/reservas/${reservaCreada.id}/estado`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        expected_version: reservaEditada.version, accion: 'cancelar', motivo: 'Solicitud del huésped',
      }),
    }), env, params: { id: String(reservaCreada.id) },
  });
  assert.equal(sinCsrf.status, 403);

  const cancelada = await cambiarEstadoAdmin({
    request: new Request(`https://test/api/v1/admin/reservas/${reservaCreada.id}/estado`, {
      method: 'POST', headers, body: JSON.stringify({
        expected_version: reservaEditada.version, accion: 'cancelar', motivo: 'Solicitud del huésped',
      }),
    }), env, params: { id: String(reservaCreada.id) },
  });
  assert.equal(cancelada.status, 200);
  assert.equal((await cancelada.json() as any).data.estadoFlujo, 'cancelada');
  assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM ocupacion_reserva_noches
    WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = ?)
      AND estado = 'liberada'`).get(reservaCreada.id)?.n, 2);
  sqlite.close();
});
