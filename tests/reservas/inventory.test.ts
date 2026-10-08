import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  calcularDisponibilidadInventario,
  modalidadValidaParaEspacio,
  type EspacioInventario,
  type ModalidadEspacio,
  type UnidadAsignable,
} from '../../functions/_domain/reservas/accommodationInventory.ts';
import { D1RepositorioInventarioAlojamiento } from '../../functions/_infrastructure/d1/D1RepositorioInventarioAlojamiento.ts';

const baselineSql = readFileSync(new URL('../../migrations/0001_initial_reservas.sql', import.meta.url), 'utf8');
const coreSql = readFileSync(new URL('../../migrations/0002_normalize_reservation_core.sql', import.meta.url), 'utf8');
const inventorySql = readFileSync(new URL('../../migrations/0003_accommodation_inventory.sql', import.meta.url), 'utf8');
const verifyInventorySql = readFileSync(new URL('../../scripts/reservas/verificar-inventario.sql', import.meta.url), 'utf8');

function espacio(overrides: Partial<EspacioInventario> = {}): EspacioInventario {
  return {
    id: 1,
    codigo: 'domo-1',
    nombre: 'Domo 1',
    tipo: 'domo',
    parentId: null,
    capacidadComercial: 7,
    capacidadOperativaMaxima: 10,
    reservableGeneral: true,
    reservableRetiro: true,
    estado: 'activo',
    ...overrides,
  };
}

function modalidad(overrides: Partial<ModalidadEspacio> = {}): ModalidadEspacio {
  return {
    espacioId: 1,
    modalidad: 'compartida',
    contexto: 'general',
    unidadVenta: 'cama',
    habilitada: true,
    ...overrides,
  };
}

function unidad(id: number, overrides: Partial<UnidadAsignable> = {}): UnidadAsignable {
  return {
    id,
    espacioId: 1,
    codigo: `unidad-${id}`,
    nombre: `Unidad ${id}`,
    tipo: 'cama_simple',
    capacidad: 1,
    estado: 'activa',
    asignable: true,
    ...overrides,
  };
}

test('valida modalidades por tipo, contexto y estado del espacio', () => {
  assert.equal(modalidadValidaParaEspacio(espacio(), modalidad()), true);
  assert.equal(
    modalidadValidaParaEspacio(
      espacio({ codigo: 'refugio-habitacion-4', tipo: 'habitacion', capacidadComercial: 4, capacidadOperativaMaxima: 4 }),
      modalidad({ modalidad: 'privada', unidadVenta: 'espacio' })
    ),
    true
  );
  assert.equal(
    modalidadValidaParaEspacio(
      espacio({ codigo: 'refugio-habitacion-3', tipo: 'habitacion' }),
      modalidad({ modalidad: 'privada', unidadVenta: 'espacio' })
    ),
    false
  );
  assert.equal(
    modalidadValidaParaEspacio(
      espacio({ codigo: 'salon', tipo: 'salon', reservableGeneral: false }),
      modalidad({ modalidad: 'compartida', contexto: 'retiro', unidadVenta: 'espacio' })
    ),
    false
  );
  assert.equal(
    modalidadValidaParaEspacio(
      espacio({ tipo: 'camping' }),
      modalidad({ modalidad: 'camping', unidadVenta: 'parcela' })
    ),
    true
  );
  assert.equal(modalidadValidaParaEspacio(espacio(), modalidad({ espacioId: 2 })), false);
  assert.equal(modalidadValidaParaEspacio(espacio(), modalidad({ habilitada: false })), false);
  assert.equal(modalidadValidaParaEspacio(espacio({ estado: 'inactivo' }), modalidad()), false);
  assert.equal(
    modalidadValidaParaEspacio(espacio({ reservableRetiro: false }), modalidad({ contexto: 'retiro' })),
    false
  );
});

test('calcula disponibilidad privada y compartida sobre unidades asignables', () => {
  const unidades = [
    unidad(1),
    unidad(2, { capacidad: 2, tipo: 'cama_doble' }),
    unidad(3, { estado: 'mantenimiento' }),
    unidad(4, { asignable: false }),
  ];

  assert.deepEqual(
    calcularDisponibilidadInventario(espacio(), modalidad(), unidades, new Set([1]), 2),
    { disponible: true, capacidadDisponible: 2, unidadesDisponibles: [2] }
  );
  assert.deepEqual(
    calcularDisponibilidadInventario(espacio(), modalidad(), unidades, new Set([1]), 3),
    { disponible: false, capacidadDisponible: 2, unidadesDisponibles: [2] }
  );
  assert.deepEqual(
    calcularDisponibilidadInventario(
      espacio(),
      modalidad({ modalidad: 'privada', unidadVenta: 'espacio' }),
      unidades,
      new Set(),
      7
    ),
    { disponible: true, capacidadDisponible: 7, unidadesDisponibles: [] }
  );
  assert.deepEqual(
    calcularDisponibilidadInventario(
      espacio(),
      modalidad({ modalidad: 'privada', unidadVenta: 'espacio' }),
      unidades,
      new Set([2]),
      1
    ),
    { disponible: false, capacidadDisponible: 0, unidadesDisponibles: [] }
  );
  assert.deepEqual(
    calcularDisponibilidadInventario(espacio(), modalidad(), unidades, new Set(), 0),
    { disponible: false, capacidadDisponible: 0, unidadesDisponibles: [] }
  );
});

test('el repositorio D1 lista sólo espacios y unidades reservables', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const respuestas = [
    [{
      id: 1, codigo: 'domo-1', nombre: 'Domo 1', tipo: 'domo', parent_id: null,
      capacidad_comercial: 7, capacidad_operativa_maxima: 10,
      reservable_general: 1, reservable_retiro: 1, estado: 'activo',
    }],
    [{ espacio_id: 1, modalidad: 'privada', contexto: 'general', unidad_venta: 'espacio', habilitada: 1 }],
    [{
      id: 10, espacio_id: 1, codigo: 'domo-1-plaza-01', nombre: 'Plaza flexible 1',
      tipo: 'plaza_flexible', capacidad: 1, estado: 'activa', asignable: 1,
    }],
  ];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      const rows = respuestas.shift();
      return {
        bind(...values: unknown[]) {
          call.values = values;
          return this;
        },
        async all() {
          return { results: rows };
        },
      };
    },
  };
  const repository = new D1RepositorioInventarioAlojamiento(db);

  const espacios = await repository.listarEspaciosReservables('general', 'privada');
  const modalidades = await repository.listarModalidades(1);
  const unidades = await repository.listarUnidadesAsignables(1);

  assert.deepEqual(espacios[0], espacio());
  assert.deepEqual(modalidades[0], modalidad({ modalidad: 'privada', unidadVenta: 'espacio' }));
  assert.equal(unidades[0].tipo, 'plaza_flexible');
  assert.deepEqual(calls[0].values, ['general', 'privada']);
  assert.deepEqual(calls[1].values, [1]);
  assert.deepEqual(calls[2].values, [1]);
  assert.match(calls[0].query, /m\.habilitada = 1/);
  assert.doesNotMatch(calls[0].query, /instalaciones/);
  assert.match(calls[2].query, /WITH RECURSIVE descendientes/);
});

test('migra y verifica el inventario conocido sin tocar la estructura de reservas', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(baselineSql);
  db.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado
    ) VALUES ('Mapeo existente', 2, '2026-12-01', '2026-12-02', 1, 100, 'pendiente');
  `);
  db.exec(coreSql);
  const columnasReservas = db.prepare("SELECT name FROM pragma_table_info('reservas') ORDER BY cid")
    .all().map(row => String(row.name));

  db.exec(inventorySql);
  db.exec(inventorySql);
  db.exec(verifyInventorySql);

  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM espacios').get()?.n, 8);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM unidades_inventario').get()?.n, 29);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM instalaciones').get()?.n, 15);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM reserva_estadia_espacios').get()?.n,
    1
  );
  assert.equal(
    db.prepare(`
      SELECT e.codigo
      FROM reserva_estadia_espacios ree
      JOIN espacios e ON e.id = ree.espacio_id
    `).get()?.codigo,
    'domo-2'
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM unidades_inventario WHERE codigo LIKE 'refugio-%-cama-%' AND tipo = 'cama_simple'").get()?.n,
    15
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS n
      FROM modalidades_espacio m JOIN espacios e ON e.id = m.espacio_id
      WHERE e.codigo = 'refugio-habitacion-4' AND m.modalidad = 'privada' AND m.habilitada = 1
    `).get()?.n,
    1
  );
  assert.equal(
    db.prepare(`
      SELECT COUNT(*) AS n
      FROM modalidades_espacio m JOIN espacios e ON e.id = m.espacio_id
      WHERE e.codigo = 'salon' AND m.habilitada = 1
    `).get()?.n,
    0
  );

  assert.throws(
    () => db.exec(`
      INSERT INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta)
      SELECT id, 'privada', 'general', 'espacio'
      FROM espacios WHERE codigo = 'refugio-habitacion-3';
    `),
    /modalidad no habilitada/
  );
  assert.throws(
    () => db.exec(`
      UPDATE modalidades_espacio SET habilitada = 1
      WHERE espacio_id = (SELECT id FROM espacios WHERE codigo = 'salon');
    `),
    /modalidad no habilitada/
  );
  assert.throws(
    () => db.exec(`
      UPDATE modalidades_espacio
      SET modalidad = 'privada', unidad_venta = 'espacio'
      WHERE espacio_id = (SELECT id FROM espacios WHERE codigo = 'refugio-habitacion-3')
        AND modalidad = 'compartida';
    `),
    /modalidad no habilitada/
  );

  db.exec(`
    INSERT INTO espacios (
      codigo, nombre, tipo, capacidad_comercial, capacidad_operativa_maxima,
      reservable_general, reservable_retiro
    ) VALUES ('bell-tent-1', 'Bell tent 1', 'bell_tent', 2, 2, 1, 1);
    INSERT INTO modalidades_espacio (espacio_id, modalidad, contexto, unidad_venta)
    SELECT id, 'privada', 'general', 'espacio' FROM espacios WHERE codigo = 'bell-tent-1';
    INSERT INTO unidades_inventario (espacio_id, codigo, nombre, tipo, capacidad)
    SELECT id, 'bell-tent-1-cama-doble', 'Cama doble', 'cama_doble', 2
    FROM espacios WHERE codigo = 'bell-tent-1';
  `);
  assert.equal(
    db.prepare("SELECT capacidad FROM unidades_inventario WHERE codigo = 'bell-tent-1-cama-doble'").get()?.capacidad,
    2
  );
  assert.deepEqual(
    db.prepare("SELECT name FROM pragma_table_info('reservas') ORDER BY cid")
      .all().map(row => String(row.name)),
    columnasReservas
  );

  db.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado
    ) VALUES ('Mapeo nuevo', 1, '2027-01-01', '2027-01-02', 1, 100, 'pendiente');
  `);
  assert.equal(
    db.prepare(`
      SELECT e.codigo
      FROM reserva_estadia_espacios ree
      JOIN espacios e ON e.id = ree.espacio_id
      JOIN reserva_estadias re ON re.id = ree.reserva_estadia_id
      JOIN reservas r ON r.id = re.reserva_id
      WHERE r.cliente_nombre = 'Mapeo nuevo'
    `).get()?.codigo,
    'domo-1'
  );
  db.close();
});
