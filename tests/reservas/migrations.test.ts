import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const baselineSql = readFileSync(
  new URL('../../migrations/0001_initial_reservas.sql', import.meta.url),
  'utf8'
);
const normalizacionSql = readFileSync(
  new URL('../../migrations/0002_normalize_reservation_core.sql', import.meta.url),
  'utf8'
);
const preflightSql = readFileSync(
  new URL('../../scripts/reservas/preflight-migracion.sql', import.meta.url),
  'utf8'
);
const verificacionSql = readFileSync(
  new URL('../../scripts/reservas/verificar-migracion.sql', import.meta.url),
  'utf8'
);

function nuevaBase(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

function aplicarMigracionAtomica(db: DatabaseSync, sql: string): void {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(sql);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function tablas(db: DatabaseSync): string[] {
  return db.prepare(
    "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all().map(row => String(row.name));
}

test('aplica el esquema completo sobre una base vacía', () => {
  const db = nuevaBase();

  aplicarMigracionAtomica(db, baselineSql);
  aplicarMigracionAtomica(db, normalizacionSql);
  db.exec(verificacionSql);

  const nombres = tablas(db);
  for (const tabla of [
    'reservas',
    'reserva_estadias',
    'asignaciones_inventario',
    'ocupacion_noches',
    'pagos',
    'reserva_eventos',
    'mapeo_ids_legacy',
    'schema_migrations',
  ]) {
    assert.ok(nombres.includes(tabla), `falta la tabla ${tabla}`);
  }

  assert.deepEqual(
    db.prepare('SELECT version FROM schema_migrations ORDER BY version').all()
      .map(row => ({ version: String(row.version) })),
    [{ version: '0001' }, { version: '0002' }]
  );
  db.close();
});

test('reconcilia una copia representativa del esquema legacy sin perder identidad ni importes', () => {
  const db = nuevaBase();
  aplicarMigracionAtomica(db, baselineSql);
  db.exec(`
    CREATE TABLE d1_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO d1_migrations (name) VALUES ('0001_initial_reservas.sql');

    INSERT INTO reservas (
      id, cliente_nombre, cliente_telefono, cliente_email, alojamiento_id,
      fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena,
      estado, mp_preference_id, mp_payment_id, unidad_asignada, canal_origen,
      ical_uid, tipo_estadia
    ) VALUES (
      42, 'Huésped Legacy', '+5491112345678', 'legacy@example.test', 1,
      '2026-11-10', '2026-11-13', 2, 1234.56, 250.10,
      'confirmada', 'pref-42', 'pay-42', 'Domo 1 cama norte', 'Web',
      'ical-42', 'huesped'
    );

    INSERT INTO consultas (
      cliente_nombre, alojamiento_interes, cantidad_personas, monto_estimado,
      fecha_consulta
    ) VALUES ('Lead Legacy', 'Domo', 2, 987.65, '2026-10-05T12:00:00Z');
  `);

  db.exec(preflightSql);
  aplicarMigracionAtomica(db, normalizacionSql);
  db.exec(verificacionSql);

  const reserva = db.prepare(`
    SELECT reserva_uid, codigo, moneda, monto_total_centavos,
           monto_sena_centavos, updated_at, version
    FROM reservas WHERE id = 42
  `).get();
  assert.deepEqual({ ...reserva }, {
    reserva_uid: 'legacy-000000000042',
    codigo: 'RES-00000042',
    moneda: 'ARS',
    monto_total_centavos: 123456,
    monto_sena_centavos: 25010,
    updated_at: reserva?.updated_at,
    version: 1,
  });
  assert.ok(reserva?.updated_at);

  assert.deepEqual(
    { ...db.prepare(`
      SELECT reserva_id, fecha_checkin, fecha_checkout, cantidad_huespedes,
             alojamiento_legacy_id, modalidad
      FROM reserva_estadias WHERE reserva_id = 42
    `).get() },
    {
      reserva_id: 42,
      fecha_checkin: '2026-11-10',
      fecha_checkout: '2026-11-13',
      cantidad_huespedes: 2,
      alojamiento_legacy_id: 1,
      modalidad: 'sin_definir',
    }
  );

  assert.equal(
    db.prepare('SELECT unidad_legacy_texto FROM asignaciones_inventario').get()?.unidad_legacy_texto,
    'Domo 1 cama norte'
  );
  assert.deepEqual(
    { ...db.prepare('SELECT estado, monto_centavos, external_payment_id FROM pagos').get() },
    { estado: 'aprobado', monto_centavos: 25010, external_payment_id: 'pay-42' }
  );
  assert.equal(
    db.prepare('SELECT monto_estimado_centavos FROM consultas').get()?.monto_estimado_centavos,
    98765
  );
  assert.equal(
    db.prepare("SELECT id_nuevo FROM mapeo_ids_legacy WHERE tipo_entidad = 'reserva'").get()?.id_nuevo,
    'legacy-000000000042'
  );

  db.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado
    ) VALUES ('Compatibilidad', 2, '2026-12-01', '2026-12-02', 1, 10.25, 'pendiente');
  `);
  const insertada = db.prepare(`
    SELECT reserva_uid, codigo, monto_total_centavos, updated_at, version
    FROM reservas WHERE cliente_nombre = 'Compatibilidad'
  `).get();
  assert.ok(insertada?.reserva_uid);
  assert.ok(insertada?.codigo);
  assert.equal(insertada?.monto_total_centavos, 1025);
  assert.ok(insertada?.updated_at);
  assert.equal(insertada?.version, 1);
  const idInsertada = db.prepare(
    "SELECT id FROM reservas WHERE cliente_nombre = 'Compatibilidad'"
  ).get()?.id;
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM reserva_estadias WHERE reserva_id = ?')
      .get(idInsertada)?.n,
    1
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM reserva_eventos WHERE reserva_id = ? AND tipo = 'reserva.creada_legacy'")
      .get(idInsertada)?.n,
    1
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM mapeo_ids_legacy WHERE tipo_entidad = 'reserva' AND id_legacy = ?")
      .get(String(idInsertada))?.n,
    1
  );

  db.prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = ?").run(42);
  assert.equal(db.prepare('SELECT version FROM reservas WHERE id = 42').get()?.version, 2);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM reserva_eventos WHERE reserva_id = 42 AND tipo = 'reserva.actualizada_legacy'").get()?.n,
    1
  );
  db.exec(verificacionSql);
  db.close();
});

test('aborta y revierte el backfill cuando un identificador externo está duplicado', () => {
  const db = nuevaBase();
  aplicarMigracionAtomica(db, baselineSql);
  db.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, mp_payment_id
    ) VALUES
      ('Duplicada A', 1, '2026-11-01', '2026-11-02', 1, 100, 'confirmada', 'pay-dup'),
      ('Duplicada B', 2, '2026-11-02', '2026-11-03', 1, 100, 'confirmada', 'pay-dup');
  `);

  assert.throws(
    () => aplicarMigracionAtomica(db, normalizacionSql),
    /CHECK constraint failed/
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('reservas') WHERE name = 'reserva_uid'").get()?.n,
    0
  );
  assert.equal(tablas(db).includes('reserva_estadias'), false);
  db.close();
});
