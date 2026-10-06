import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const raiz = resolve(import.meta.dirname, '..', '..');

function abrir() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

let db = abrir();
const migraciones = readdirSync(join(raiz, 'migrations'))
  .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre))
  .sort();
for (const nombre of migraciones) {
  db.exec(readFileSync(join(raiz, 'migrations', nombre), 'utf8'));
}
db.exec(`
  INSERT INTO reservas (
    cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
    cantidad_personas, monto_total, monto_sena, estado, canal_origen
  ) VALUES (
    'QA RECOVERY DRILL', 1, '2099-01-10', '2099-01-12',
    1, 100, 25, 'pendiente', 'RecoveryDrill'
  );
`);
const id = Number(db.prepare("SELECT id FROM reservas WHERE canal_origen = 'RecoveryDrill'").get()?.id);
assert.ok(id > 0, 'no se creó el registro de control');
const backup = db.serialize();

db.prepare("UPDATE reservas SET cliente_nombre = 'QA DATO CORRUPTO' WHERE id = ?").run(id);
assert.equal(db.prepare('SELECT cliente_nombre FROM reservas WHERE id = ?').get(id)?.cliente_nombre, 'QA DATO CORRUPTO');
db.close();

db = abrir();
db.deserialize(backup);
db.exec('PRAGMA foreign_keys = ON');
assert.equal(db.prepare('SELECT cliente_nombre FROM reservas WHERE id = ?').get(id)?.cliente_nombre, 'QA RECOVERY DRILL');
assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
assert.deepEqual(
  db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
  ['0001', '0002', '0003', '0004', '0005']
);
db.close();

console.log(JSON.stringify({
  event: 'recovery.drill.completed',
  environment: 'ephemeral-local',
  migrations: migraciones.length,
  restored_record: true,
  foreign_keys_valid: true,
}));
