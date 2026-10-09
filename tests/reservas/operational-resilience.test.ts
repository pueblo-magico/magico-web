import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of [
    '0001_initial_reservas.sql',
    '0002_normalize_reservation_core.sql',
    '0003_accommodation_inventory.sql',
    '0004_capacity_exceptions.sql',
    '0005_security_rbac_pii.sql',
  ]) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

test('la restricción nocturna impide dos ocupaciones concurrentes de la misma unidad', () => {
  const db = baseCompleta();
  const insertarReserva = db.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen
    ) VALUES (?, 1, '2099-02-10', '2099-02-12', 1, 100, 25, 'confirmada', 'QA')
    RETURNING id
  `);
  const reservaA = Number(insertarReserva.get('QA OVERBOOK A')?.id);
  const reservaB = Number(insertarReserva.get('QA OVERBOOK B')?.id);
  const estadiaA = Number(db.prepare('SELECT id FROM reserva_estadias WHERE reserva_id = ?').get(reservaA)?.id);
  const estadiaB = Number(db.prepare('SELECT id FROM reserva_estadias WHERE reserva_id = ?').get(reservaB)?.id);
  const unidad = Number(db.prepare("SELECT id FROM unidades_inventario WHERE estado = 'activa' AND asignable = 1 ORDER BY id LIMIT 1").get()?.id);

  db.prepare(`
    INSERT INTO ocupacion_noches (reserva_estadia_id, unidad_inventario_id, fecha, cantidad_huespedes)
    VALUES (?, ?, '2099-02-10', 1)
  `).run(estadiaA, unidad);

  assert.throws(() => db.prepare(`
    INSERT INTO ocupacion_noches (reserva_estadia_id, unidad_inventario_id, fecha, cantidad_huespedes)
    VALUES (?, ?, '2099-02-10', 1)
  `).run(estadiaB, unidad), /UNIQUE constraint failed/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ocupacion_noches').get()?.n, 1);
  db.close();
});

test('una clave idempotente impide registrar dos veces el mismo procesamiento de pago', () => {
  const db = baseCompleta();
  const reservaId = Number(db.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen
    ) VALUES ('QA PAYMENT', 1, '2099-03-10', '2099-03-12', 1, 100, 25, 'pendiente', 'QA')
    RETURNING id
  `).get()?.id);
  const insertar = db.prepare(`
    INSERT INTO pagos (
      reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
      external_payment_id, idempotency_key
    ) VALUES (?, 'mercado_pago', 'sena', 'aprobado', 2500, 'ARS', ?, ?)
  `);

  insertar.run(reservaId, 'payment-qa-1', 'webhook:payment-qa-1');
  assert.throws(
    () => insertar.run(reservaId, 'payment-qa-2', 'webhook:payment-qa-1'),
    /UNIQUE constraint failed/
  );
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pagos WHERE proveedor = 'mercado_pago'").get()?.n, 1);
  db.close();
});
