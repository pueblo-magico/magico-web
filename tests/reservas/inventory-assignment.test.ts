import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import {
  asignarInventarioReserva,
  liberarInventarioReserva,
} from '../../functions/_application/reservas/gestionarAsignacionInventario.ts';
import { planificarAsignacionInventario } from '../../functions/_domain/reservas/inventoryAssignment.ts';
import { D1RepositorioAsignacionInventario } from '../../functions/_infrastructure/d1/D1RepositorioAsignacionInventario.ts';
import { onRequestGet as asignacionesAdmin } from '../../functions/api/v1/admin/reservas/[id]/asignaciones.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre))
    .sort()) {
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

function crearReservaConfirmada(
  sqlite: DatabaseSync,
  personas = 2,
  checkin = '2099-10-10',
  checkout = '2099-10-12'
): { id: number; version: number } {
  const id = Number(sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA INVENTARIO', 3, ?, ?, ?, 100, 'confirmada', 'QA')
    RETURNING id
  `).get(checkin, checkout, personas)?.id);
  const row = sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(id);
  return { id, version: Number(row?.version) };
}

function solicitud(
  reserva: { id: number; version: number },
  overrides: Partial<Parameters<typeof asignarInventarioReserva>[0]> = {}
) {
  return {
    reservaId: reserva.id,
    expectedVersion: reserva.version,
    espacioCodigo: 'refugio-habitacion-4',
    modalidad: 'privada' as const,
    unidadesCodigos: [],
    actorEmail: 'qa-admin@pueblomagico.local',
    correlationId: `qa-${reserva.id}`,
    operacionUid: `op-${reserva.id}-${reserva.version}`,
    ...overrides,
  };
}

test('la asignación privada bloquea todas las camas y conserva las camas realmente ocupadas', async () => {
  const sqlite = baseCompleta();
  const reserva = crearReservaConfirmada(sqlite);
  const resultado = await asignarInventarioReserva(
    solicitud(reserva), new D1RepositorioAsignacionInventario(d1(sqlite))
  );

  assert.equal(resultado.reservaVersion, reserva.version + 1);
  assert.equal(resultado.unidades.length, 4);
  assert.equal(resultado.capacidadRestante, 0);
  assert.equal(resultado.unidades.reduce((total, unidad) => total + unidad.cantidadHuespedes, 0), 2);
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM ocupacion_noches WHERE reserva_estadia_id = ? AND estado = 'activa'
  `).get(resultado.estadiaId)?.n, 8);
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM reserva_eventos WHERE reserva_id = ? AND tipo = 'reserva.asignada'
  `).get(reserva.id)?.n, 1);
  sqlite.close();
});

test('una asignación compartida no puede usar una cama ocupada en una noche solapada', async () => {
  const sqlite = baseCompleta();
  const repository = new D1RepositorioAsignacionInventario(d1(sqlite));
  const privada = crearReservaConfirmada(sqlite);
  await asignarInventarioReserva(solicitud(privada), repository);
  const compartida = crearReservaConfirmada(sqlite, 1, '2099-10-11', '2099-10-13');

  await assert.rejects(
    asignarInventarioReserva(solicitud(compartida, {
      modalidad: 'compartida',
      unidadesCodigos: ['refugio-habitacion-4-cama-01'],
    }), repository),
    /ocupada o bloqueada/
  );
  assert.equal(sqlite.prepare('SELECT version FROM reservas WHERE id = ?').get(compartida.id)?.version, compartida.version);
  assert.equal(sqlite.prepare(`
    SELECT COUNT(*) n FROM asignaciones_inventario ai
    JOIN reserva_estadias re ON re.id = ai.reserva_estadia_id
    WHERE re.reserva_id = ? AND ai.estado = 'activa'
  `).get(compartida.id)?.n, 0);
  sqlite.close();
});

test('cambia y libera una asignación sin borrar su historial', async () => {
  const sqlite = baseCompleta();
  const repository = new D1RepositorioAsignacionInventario(d1(sqlite));
  const reserva = crearReservaConfirmada(sqlite);
  const inicial = await asignarInventarioReserva(solicitud(reserva, {
    modalidad: 'compartida',
    unidadesCodigos: ['refugio-habitacion-4-cama-01', 'refugio-habitacion-4-cama-02'],
  }), repository);
  const cambiada = await asignarInventarioReserva(solicitud(
    { id: reserva.id, version: inicial.reservaVersion },
    {
      espacioCodigo: 'refugio-habitacion-3',
      modalidad: 'compartida',
      unidadesCodigos: ['refugio-habitacion-3-cama-01', 'refugio-habitacion-3-cama-02'],
      operacionUid: 'op-cambio',
    }
  ), repository);
  const liberada = await liberarInventarioReserva({
    reservaId: reserva.id,
    expectedVersion: cambiada.reservaVersion,
    actorEmail: 'qa-admin@pueblomagico.local',
    correlationId: 'qa-liberar',
    operacionUid: 'op-liberar',
  }, repository);

  assert.equal(liberada.reservaVersion, cambiada.reservaVersion + 1);
  assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM asignaciones_inventario ai
    JOIN reserva_estadias re ON re.id = ai.reserva_estadia_id
    WHERE re.reserva_id = ?`).get(reserva.id)?.n, 4);
  assert.equal(sqlite.prepare(`SELECT COUNT(*) n FROM ocupacion_noches onoc
    JOIN reserva_estadias re ON re.id = onoc.reserva_estadia_id
    WHERE re.reserva_id = ? AND onoc.estado = 'activa'`).get(reserva.id)?.n, 0);
  assert.deepEqual(
    sqlite.prepare(`SELECT accion FROM operaciones_asignacion_inventario
      WHERE reserva_id = ? ORDER BY id`).all(reserva.id).map(row => row.accion),
    ['asignar', 'cambiar', 'liberar']
  );
  sqlite.close();
});

test('una cama doble aloja dos personas sin inventar dos unidades', () => {
  const plan = planificarAsignacionInventario({
    reservaId: 1, reservaVersion: 1, estadoFlujo: 'confirmada', estadiaId: 1,
    fechaCheckin: '2099-11-01', fechaCheckout: '2099-11-02', cantidadHuespedes: 2,
    espacioId: 20, espacioCodigo: 'bell-1', espacioTipo: 'bell_tent', capacidadComercial: 2,
    modalidad: 'compartida', modalidadHabilitada: true,
    unidades: [{ id: 30, codigo: 'bell-1-doble-01', capacidad: 2 }],
  }, { expectedVersion: 1, unidadesCodigos: ['bell-1-doble-01'] });

  assert.deepEqual(plan.asignaciones, [
    { id: 30, codigo: 'bell-1-doble-01', capacidad: 2, cantidadHuespedes: 2 },
  ]);
  assert.equal(plan.unidadesBloqueadas.length, 1);
});

test('el mismo contrato admite parcelas configuradas para camping', () => {
  const plan = planificarAsignacionInventario({
    reservaId: 1, reservaVersion: 3, estadoFlujo: 'confirmada', estadiaId: 1,
    fechaCheckin: '2099-12-01', fechaCheckout: '2099-12-03', cantidadHuespedes: 4,
    espacioId: 40, espacioCodigo: 'camping-norte', espacioTipo: 'camping', capacidadComercial: 8,
    modalidad: 'camping', modalidadHabilitada: true,
    unidades: [{ id: 41, codigo: 'parcela-01', capacidad: 4 }],
  }, { expectedVersion: 3, unidadesCodigos: ['parcela-01'] });

  assert.equal(plan.asignaciones[0].cantidadHuespedes, 4);
  assert.deepEqual(plan.noches, ['2099-12-01', '2099-12-02']);
});

test('el salón no puede asignarse como alojamiento sin el flujo específico de retiro', () => {
  assert.throws(() => planificarAsignacionInventario({
    reservaId: 1, reservaVersion: 1, estadoFlujo: 'confirmada', estadiaId: 1,
    fechaCheckin: '2099-12-01', fechaCheckout: '2099-12-02', cantidadHuespedes: 2,
    espacioId: 50, espacioCodigo: 'salon', espacioTipo: 'salon', capacidadComercial: 20,
    modalidad: 'compartida', modalidadHabilitada: true,
    unidades: [{ id: 51, codigo: 'salon-sector-01', capacidad: 20 }],
  }, { expectedVersion: 1, unidadesCodigos: ['salon-sector-01'] }), /no está habilitada/);
});

test('la lectura administrativa de asignaciones exige sesión', async () => {
  const response = await asignacionesAdmin({
    request: new Request('https://test/api/v1/admin/reservas/1/asignaciones'),
    env: { SESSION_SECRET: 'session-secret-seguro-de-al-menos-32-caracteres' },
    params: { id: '1' },
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'No autenticado.' });
});
