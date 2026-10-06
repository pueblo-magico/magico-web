import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { backup as backupDatabase, DatabaseSync } from 'node:sqlite';

const raiz = resolve(import.meta.dirname, '..', '..');

function abrir(path = ':memory:') {
  const db = new DatabaseSync(path);
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
const serializable = typeof db.serialize === 'function' && process.env.RECOVERY_DRILL_FORCE_FILE_BACKUP !== '1';
const carpeta = serializable ? null : mkdtempSync(join(tmpdir(), 'magico-reservas-recovery-'));
const archivoBackup = carpeta ? join(carpeta, 'reservas.backup.sqlite') : null;
const backup = serializable ? db.serialize() : null;
if (archivoBackup) await backupDatabase(db, archivoBackup);

db.prepare("UPDATE reservas SET cliente_nombre = 'QA DATO CORRUPTO' WHERE id = ?").run(id);
assert.equal(db.prepare('SELECT cliente_nombre FROM reservas WHERE id = ?').get(id)?.cliente_nombre, 'QA DATO CORRUPTO');
db.close();

db = archivoBackup ? abrir(archivoBackup) : abrir();
if (backup) {
  db.deserialize(backup);
  db.exec('PRAGMA foreign_keys = ON');
}
assert.equal(db.prepare('SELECT cliente_nombre FROM reservas WHERE id = ?').get(id)?.cliente_nombre, 'QA RECOVERY DRILL');
assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
assert.deepEqual(
  db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version),
  migraciones.map(nombre => nombre.slice(0, 4))
);
db.exec(readFileSync(join(raiz, 'scripts', 'reservas', 'verificar-tarifas.sql'), 'utf8'));
db.close();
if (carpeta) rmSync(carpeta, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

console.log(JSON.stringify({
  event: 'recovery.drill.completed',
  environment: 'ephemeral-local',
  migrations: migraciones.length,
  restored_record: true,
  foreign_keys_valid: true,
  pricing_rules_valid: true,
}));
