import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { gestionarExcepcionCapacidad } from '../../functions/_application/reservas/gestionarExcepcionCapacidad.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioExcepcionesCapacidad,
} from '../../functions/_application/reservas/ports.ts';
import { rolTienePermiso } from '../../functions/_domain/reservas/adminPermissions.ts';
import {
  estadoEsperadoParaAccion,
  validarSolicitudExcepcionCapacidad,
  type ContextoCapacidadReserva,
  type ExcepcionCapacidad,
} from '../../functions/_domain/reservas/capacityExceptions.ts';
import { ErrorReserva } from '../../functions/_domain/reservas/errors.ts';
import { D1RepositorioExcepcionesCapacidad } from '../../functions/_infrastructure/d1/D1RepositorioExcepcionesCapacidad.ts';

const migrationUrls = [
  '../../migrations/0001_initial_reservas.sql',
  '../../migrations/0002_normalize_reservation_core.sql',
  '../../migrations/0003_accommodation_inventory.sql',
  '../../migrations/0004_capacity_exceptions.sql',
].map(path => new URL(path, import.meta.url));
const migrations = migrationUrls.map(url => readFileSync(url, 'utf8'));
const verifySql = readFileSync(
  new URL('../../scripts/reservas/verificar-capacidad.sql', import.meta.url),
  'utf8'
);

function contexto(overrides: Partial<ContextoCapacidadReserva> = {}): ContextoCapacidadReserva {
  return {
    reservaId: 1,
    reservaEstadiaId: 11,
    fechaCheckin: '2026-11-10',
    fechaCheckout: '2026-11-13',
    espacioCodigo: 'domo-1',
    espacioTipo: 'domo',
    capacidadComercial: 7,
    capacidadOperativaMaxima: 10,
    cantidadHuespedes: 7,
    capacidadAsignada: 7,
    ...overrides,
  };
}

function excepcion(overrides: Partial<ExcepcionCapacidad> = {}): ExcepcionCapacidad {
  return {
    id: 4,
    reservaId: 1,
    reservaEstadiaId: 11,
    capacidadAutorizada: 8,
    motivo: 'Grupo familiar',
    planCamas: 'Agregar una cama simple',
    fechaDesde: null,
    fechaHasta: null,
    estado: 'solicitada',
    solicitadaPor: 'editor@magico.test',
    decididaPor: null,
    solicitadaAt: '2026-10-05T12:00:00Z',
    decididaAt: null,
    ...overrides,
  };
}

test('valida capacidad, plan físico y alcance dentro de la estadía', () => {
  assert.deepEqual(
    validarSolicitudExcepcionCapacidad(contexto(), {
      capacidadAutorizada: 8,
      motivo: ' Grupo familiar ',
      planCamas: ' Cama adicional ',
      fechaDesde: '2026-11-10',
      fechaHasta: '2026-11-12',
    }),
    {
      reservaId: 1,
      reservaEstadiaId: 11,
      capacidadAutorizada: 8,
      motivo: 'Grupo familiar',
      planCamas: 'Cama adicional',
      fechaDesde: '2026-11-10',
      fechaHasta: '2026-11-12',
    }
  );

  const invalidas: Array<[Partial<ContextoCapacidadReserva>, any, RegExp]> = [
    [{ espacioTipo: 'refugio' }, { capacidadAutorizada: 8, motivo: 'x', planCamas: 'x' }, /sólo.*domos/],
    [{}, { capacidadAutorizada: 7, motivo: 'x', planCamas: 'x' }, /superar la capacidad comercial/],
    [{}, { capacidadAutorizada: 11, motivo: 'x', planCamas: 'x' }, /máximo operativo/],
    [{ capacidadAsignada: 9 }, { capacidadAutorizada: 8, motivo: 'x', planCamas: 'x' }, /ocupación ya asignada/],
    [{}, { capacidadAutorizada: 8, motivo: '', planCamas: 'x' }, /obligatorios/],
    [{}, { capacidadAutorizada: 8, motivo: 'x', planCamas: 'x', fechaDesde: '2026-11-10' }, /requiere fecha/],
    [{}, { capacidadAutorizada: 8, motivo: 'x', planCamas: 'x', fechaDesde: 'mal', fechaHasta: '2026-11-12' }, /no es válido/],
    [{}, { capacidadAutorizada: 8, motivo: 'x', planCamas: 'x', fechaDesde: '2026-11-09', fechaHasta: '2026-11-12' }, /dentro de la estadía/],
  ];
  for (const [ctx, solicitud, mensaje] of invalidas) {
    assert.throws(() => validarSolicitudExcepcionCapacidad(contexto(ctx), solicitud), mensaje);
  }
});

test('define transiciones y permisos administrativos explícitos', () => {
  assert.deepEqual(estadoEsperadoParaAccion('aprobar'), { actual: 'solicitada', siguiente: 'aprobada' });
  assert.deepEqual(estadoEsperadoParaAccion('rechazar'), { actual: 'solicitada', siguiente: 'rechazada' });
  assert.deepEqual(estadoEsperadoParaAccion('revocar'), { actual: 'aprobada', siguiente: 'revocada' });
  assert.equal(rolTienePermiso('super_admin', 'reservas.capacidad.autorizar'), true);
  assert.equal(rolTienePermiso('editor', 'reservas.capacidad.solicitar'), true);
  assert.equal(rolTienePermiso('editor', 'reservas.capacidad.autorizar'), false);
  assert.equal(rolTienePermiso('viewer', 'reservas.capacidad.solicitar'), false);
});

test('solicita y resuelve excepciones dejando auditoría', async () => {
  const auditorias: unknown[][] = [];
  const auditoria: RegistroAuditoriaReservas = {
    async registrar(...args) { auditorias.push(args); },
  };
  const cambios: string[] = [];
  let existente = excepcion();
  const repositorio: RepositorioExcepcionesCapacidad = {
    async obtenerContextoPorReserva() { return contexto(); },
    async obtenerPorId() { return existente; },
    async crearSolicitud(solicitud, actorEmail) {
      assert.equal(solicitud.motivo, 'Grupo familiar');
      return excepcion({ solicitadaPor: actorEmail });
    },
    async cambiarEstado(_id, actual, siguiente, actorEmail) {
      cambios.push(`${actual}->${siguiente}`);
      existente = excepcion({ estado: siguiente, decididaPor: actorEmail, decididaAt: 'ahora' });
      return existente;
    },
  };

  const solicitada = await gestionarExcepcionCapacidad({
    accion: 'solicitar',
    reservaId: 1,
    capacidadAutorizada: 8,
    motivo: 'Grupo familiar',
    planCamas: 'Cama adicional',
    actorEmail: 'editor@magico.test',
  }, repositorio, auditoria);
  assert.equal(solicitada.estado, 'solicitada');

  const aprobada = await gestionarExcepcionCapacidad({
    accion: 'aprobar', excepcionId: 4, actorEmail: 'admin@magico.test',
  }, repositorio, auditoria);
  assert.equal(aprobada.estado, 'aprobada');

  const revocada = await gestionarExcepcionCapacidad({
    accion: 'revocar', excepcionId: 4, actorEmail: 'admin@magico.test',
  }, repositorio, auditoria);
  assert.equal(revocada.estado, 'revocada');
  assert.deepEqual(cambios, ['solicitada->aprobada', 'aprobada->revocada']);
  assert.equal(auditorias.length, 3);
});

test('rechaza reservas ausentes, estados incompatibles y carreras de actualización', async () => {
  const auditoria: RegistroAuditoriaReservas = { async registrar() {} };
  const base: RepositorioExcepcionesCapacidad = {
    async obtenerContextoPorReserva() { return null; },
    async obtenerPorId() { return null; },
    async crearSolicitud() { throw new Error('no debe crear'); },
    async cambiarEstado() { return null; },
  };
  await assert.rejects(
    gestionarExcepcionCapacidad({
      accion: 'solicitar', reservaId: 404, capacidadAutorizada: 8,
      motivo: 'x', planCamas: 'x', actorEmail: 'x',
    }, base, auditoria),
    (error: unknown) => error instanceof ErrorReserva && error.codigo === 'RESERVA_NO_ENCONTRADA'
  );
  await assert.rejects(
    gestionarExcepcionCapacidad({ accion: 'aprobar', excepcionId: 404, actorEmail: 'x' }, base, auditoria),
    /No existe la excepción/
  );

  const incompatible = { ...base, async obtenerPorId() { return excepcion({ estado: 'rechazada' }); } };
  await assert.rejects(
    gestionarExcepcionCapacidad({ accion: 'aprobar', excepcionId: 4, actorEmail: 'x' }, incompatible, auditoria),
    /no se puede aprobar/
  );

  const carrera = { ...base, async obtenerPorId() { return excepcion(); } };
  await assert.rejects(
    gestionarExcepcionCapacidad({ accion: 'rechazar', excepcionId: 4, actorEmail: 'x' }, carrera, auditoria),
    /cambió mientras/
  );

  const revocacionInsegura = {
    ...base,
    async obtenerPorId() { return excepcion({ estado: 'aprobada' }); },
    async obtenerContextoPorReserva() { return contexto({ cantidadHuespedes: 8 }); },
  };
  await assert.rejects(
    gestionarExcepcionCapacidad({ accion: 'revocar', excepcionId: 4, actorEmail: 'x' }, revocacionInsegura, auditoria),
    /Antes de revocar/
  );

  const revocacionSinReserva = {
    ...base,
    async obtenerPorId() { return excepcion({ estado: 'aprobada' }); },
  };
  await assert.rejects(
    gestionarExcepcionCapacidad({ accion: 'revocar', excepcionId: 4, actorEmail: 'x' }, revocacionSinReserva, auditoria),
    /No existe la reserva/
  );
});

test('el repositorio D1 encapsula contexto, alta y transición optimista', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const row = {
    id: 4, reserva_id: 1, reserva_estadia_id: 11, capacidad_autorizada: 8,
    motivo: 'Grupo', plan_camas: 'Cama', fecha_desde: null, fecha_hasta: null,
    estado: 'solicitada', solicitada_por: 'editor@test', decidida_por: null,
    solicitada_at: 'ahora', decidida_at: null,
  };
  const responses: Array<Record<string, unknown> | null> = [
    {
      reserva_id: 1, reserva_estadia_id: 11, fecha_checkin: '2026-11-10', fecha_checkout: '2026-11-13',
      espacio_codigo: 'domo-1', espacio_tipo: 'domo', capacidad_comercial: 7,
      capacidad_operativa_maxima: 10, cantidad_huespedes: 7, capacidad_asignada: 7,
    },
    null,
    row,
    null,
    { ...row },
    { id: 4 },
    { ...row, estado: 'aprobada', decidida_por: 'admin@test', decidida_at: 'después' },
    null,
  ];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) { call.values = values; return this; },
        async first() { return responses.shift() ?? null; },
      };
    },
  };
  const repositorio = new D1RepositorioExcepcionesCapacidad(db);

  assert.equal((await repositorio.obtenerContextoPorReserva(1))?.capacidadOperativaMaxima, 10);
  assert.equal(await repositorio.obtenerContextoPorReserva(404), null);
  assert.equal((await repositorio.obtenerPorId(4))?.fechaDesde, null);
  assert.equal(await repositorio.obtenerPorId(404), null);
  assert.equal((await repositorio.crearSolicitud({
    reservaId: 1, reservaEstadiaId: 11, capacidadAutorizada: 8,
    motivo: 'Grupo', planCamas: 'Cama', fechaDesde: null, fechaHasta: null,
  }, 'editor@test')).reservaId, 1);
  assert.equal((await repositorio.cambiarEstado(4, 'solicitada', 'aprobada', 'admin@test'))?.estado, 'aprobada');
  assert.equal(await repositorio.cambiarEstado(9, 'solicitada', 'rechazada', 'admin@test'), null);
  assert.deepEqual(calls[0].values, [1]);
  assert.match(calls[5].query, /WHERE id = \?3 AND estado = \?4/);
});

function nuevaDb(hasta = 4): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const sql of migrations.slice(0, hasta)) db.exec(sql);
  return db;
}

function insertarReserva(db: DatabaseSync, personas: number, nombre: string): number {
  db.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado
    ) VALUES ('${nombre}', 1, '2026-11-10', '2026-11-13', ${personas}, 100, 'confirmada');
  `);
  return Number(db.prepare('SELECT id FROM reservas WHERE cliente_nombre = ?').get(nombre)?.id);
}

test('la base exige aprobación para 8–10 y bloquea 11, transiciones inválidas y borrado', () => {
  const db = nuevaDb();
  const reservaId = insertarReserva(db, 7, 'Capacidad administrada');
  const estadiaId = Number(db.prepare('SELECT id FROM reserva_estadias WHERE reserva_id = ?').get(reservaId)?.id);

  assert.throws(() => insertarReserva(db, 8, 'Alta pública inválida'), /requiere excepcion aprobada/);
  db.prepare(`
    INSERT INTO excepciones_capacidad (
      reserva_estadia_id, capacidad_autorizada, motivo, plan_camas, solicitada_por
    ) VALUES (?, 8, 'Grupo familiar', 'Agregar cama simple', 'editor@test')
  `).run(estadiaId);
  const excepcionId = Number(db.prepare('SELECT id FROM excepciones_capacidad').get()?.id);
  assert.throws(
    () => db.prepare("UPDATE reservas SET cantidad_personas = 8 WHERE id = ?").run(reservaId),
    /requiere excepcion aprobada/
  );

  db.prepare(`
    UPDATE excepciones_capacidad
    SET estado = 'aprobada', decidida_por = 'admin@test', decidida_at = '2026-10-05T12:00:00Z'
    WHERE id = ?
  `).run(excepcionId);
  db.prepare('UPDATE reservas SET cantidad_personas = 8 WHERE id = ?').run(reservaId);
  assert.equal(db.prepare('SELECT cantidad_personas FROM reservas WHERE id = ?').get(reservaId)?.cantidad_personas, 8);
  assert.throws(
    () => db.prepare('UPDATE reservas SET cantidad_personas = 11 WHERE id = ?').run(reservaId),
    /requiere excepcion aprobada/
  );
  assert.throws(
    () => db.prepare("UPDATE excepciones_capacidad SET estado = 'revocada', decidida_por = 'admin@test', decidida_at = '2026-10-05T13:00:00Z' WHERE id = ?").run(excepcionId),
    /reduzca la ocupacion/
  );
  db.prepare('UPDATE reservas SET cantidad_personas = 7 WHERE id = ?').run(reservaId);
  db.prepare("UPDATE excepciones_capacidad SET estado = 'revocada', decidida_por = 'admin@test', decidida_at = '2026-10-05T13:00:00Z' WHERE id = ?").run(excepcionId);
  assert.throws(
    () => db.prepare("UPDATE excepciones_capacidad SET estado = 'rechazada', decidida_por = 'x', decidida_at = 'x' WHERE id = ?").run(excepcionId),
    /transicion.*invalida/
  );
  assert.throws(() => db.prepare('DELETE FROM excepciones_capacidad WHERE id = ?').run(excepcionId), /no se eliminan/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM reserva_eventos WHERE tipo LIKE 'capacidad.%'").get()?.n, 3);
  db.exec(verifySql);
  db.close();
});

test('migra excepciones preexistentes de 8–10 y aborta si encuentra más de 10', () => {
  const db = nuevaDb(3);
  const reservaId = insertarReserva(db, 9, 'Excepción histórica');
  db.exec(migrations[3]);
  const migrada = db.prepare('SELECT capacidad_autorizada, estado FROM excepciones_capacidad').get();
  assert.equal(migrada?.capacidad_autorizada, 9);
  assert.equal(migrada?.estado, 'aprobada');
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM reserva_eventos WHERE reserva_id = ? AND tipo LIKE 'capacidad.%'").get(reservaId)?.n,
    2
  );
  db.exec(verifySql);
  db.close();

  const invalida = nuevaDb(3);
  insertarReserva(invalida, 11, 'Supera máximo');
  assert.throws(() => invalida.exec(migrations[3]), /CHECK constraint failed/);
  assert.equal(
    invalida.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE type = 'table' AND name = 'excepciones_capacidad'").get()?.n,
    0
  );
  invalida.close();
});
