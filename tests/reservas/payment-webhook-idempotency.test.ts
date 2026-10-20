import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

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

function crearReserva(db: DatabaseSync, nombre: string): number {
  return Number(db.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, monto_sena, estado, canal_origen,
      hold_expires_at
    ) VALUES (?, 1, '2099-08-10', '2099-08-12', 2, 100, 25,
      'pendiente', 'QA', '2099-08-01T00:00:00.000Z')
    RETURNING id
  `).get(nombre)?.id);
}

test('la migración registra entregas externas una sola vez y valida sus datos', () => {
  const db = baseCompleta();
  const reservaId = crearReserva(db, 'QA EVENT LEDGER');
  const insertar = db.prepare(`
    INSERT INTO pago_eventos_externos (
      proveedor, evento_externo_id, external_payment_id, reserva_id,
      estado_externo, resultado, monto_centavos, moneda, correlation_id
    ) VALUES ('mercado_pago', ?, 'pay-ledger-1', ?, 'approved',
      'aplicado', 2500, ?, 'request-ledger-1')
  `);

  insertar.run('delivery-ledger-1', reservaId, 'ARS');
  assert.throws(
    () => insertar.run('delivery-ledger-1', reservaId, 'ARS'),
    /UNIQUE constraint failed/
  );
  assert.throws(
    () => insertar.run('delivery-ledger-2', reservaId, 'ars'),
    /CHECK constraint failed/
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) cantidad FROM pago_eventos_externos WHERE proveedor = 'mercado_pago'").get()?.cantidad,
    1
  );
  assert.equal(db.prepare("SELECT COUNT(*) cantidad FROM schema_migrations WHERE version = '0011'").get()?.cantidad, 1);
  db.close();
});

test('una preferencia de proveedor no puede vincularse a dos pagos', () => {
  const db = baseCompleta();
  const reservaA = crearReserva(db, 'QA PREF A');
  const reservaB = crearReserva(db, 'QA PREF B');
  const insertar = db.prepare(`
    INSERT INTO pagos (
      reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
      external_preference_id
    ) VALUES (?, 'mercado_pago', 'sena', 'pendiente', 2500, 'ARS', 'pref-unica-1')
  `);

  insertar.run(reservaA);
  assert.throws(() => insertar.run(reservaB), /UNIQUE constraint failed/);
  db.close();
});

test('el rechazo conserva el estado de flujo y el pago final proyectado', () => {
  const db = baseCompleta();
  const reservaId = crearReserva(db, 'QA RECHAZO');
  db.prepare(`
    INSERT INTO pagos (
      reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
      external_payment_id, idempotency_key
    ) VALUES (?, 'mercado_pago', 'sena', 'pendiente', 2500, 'ARS',
      'pay-rechazado-1', 'payment:pay-rechazado-1')
  `).run(reservaId);

  db.prepare(`
    UPDATE reservas SET estado = 'cancelada', estado_flujo = 'rechazada',
      mp_payment_id = 'pay-rechazado-1'
    WHERE id = ?
  `).run(reservaId);
  db.prepare(`
    UPDATE pagos SET estado = 'rechazado'
    WHERE reserva_id = ? AND proveedor = 'mercado_pago'
  `).run(reservaId);

  assert.equal(db.prepare('SELECT estado_flujo FROM reservas WHERE id = ?').get(reservaId)?.estado_flujo, 'rechazada');
  assert.equal(db.prepare("SELECT estado FROM pagos WHERE reserva_id = ? AND proveedor = 'mercado_pago'").get(reservaId)?.estado, 'rechazado');
  assert.equal(db.prepare("SELECT COUNT(*) cantidad FROM reserva_eventos WHERE reserva_id = ? AND tipo = 'reserva.pago_rechazado'").get(reservaId)?.cantidad, 1);
  db.close();
});
