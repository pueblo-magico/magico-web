import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

function baseConTarifas(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url)).filter(n => /^\d{4}_.+\.sql$/.test(n)).sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

test('migra las tarifas legacy como un plan publicado en centavos', () => {
  const db = baseConTarifas();
  const plan = db.prepare("SELECT codigo, moneda, version, estado FROM planes_tarifa WHERE codigo = 'alojamiento-base'").get();
  assert.deepEqual({ ...plan }, { codigo: 'alojamiento-base', moneda: 'ARS', version: 1, estado: 'publicado' });

  const reglas = db.prepare(`
    SELECT tipo_alojamiento, ocupacion_min, ocupacion_max, base_calculo, importe_centavos
    FROM reglas_precio ORDER BY tipo_alojamiento, ocupacion_min
  `).all();
  assert.equal(reglas.length, 5);
  assert.deepEqual({ ...reglas[0] }, {
    tipo_alojamiento: 'domo', ocupacion_min: 1, ocupacion_max: 1,
    base_calculo: 'unidad_noche', importe_centavos: 15_000_000,
  });
  assert.equal(db.prepare('SELECT COUNT(*) n FROM reglas_sena').get()?.n, 2);
  db.close();
});

test('publica sólo desayuno incluido y pensión completa a ARS 20.000 por comida', () => {
  const db = baseConTarifas();
  const tarifas = db.prepare(`
    SELECT codigo, version, precio_comida_centavos, comidas_adicionales_por_persona_noche, estado
    FROM tarifas_alimentacion ORDER BY codigo
  `).all().map(row => ({ ...row }));

  assert.deepEqual(tarifas, [
    { codigo: 'desayuno_incluido', version: 1, precio_comida_centavos: 2_000_000,
      comidas_adicionales_por_persona_noche: 0, estado: 'publicado' },
    { codigo: 'pension_completa', version: 1, precio_comida_centavos: 2_000_000,
      comidas_adicionales_por_persona_noche: 2, estado: 'publicado' },
  ]);
  assert.throws(() => db.prepare(`
    UPDATE tarifas_alimentacion SET precio_comida_centavos = 1
    WHERE codigo = 'pension_completa'
  `).run(), /immutable/);
  db.close();
});

test('conserva la versión alimentaria del snapshot al publicar una tarifa nueva', () => {
  const db = baseConTarifas();
  const planId = Number(db.prepare("SELECT id FROM planes_tarifa WHERE codigo = 'alojamiento-base'").get()?.id);
  db.prepare(`
    INSERT INTO cotizaciones (
      codigo, plan_tarifa_id, plan_codigo, plan_version, moneda,
      fecha_checkin, fecha_checkout, cantidad_personas,
      subtotal_centavos, sena_centavos, total_centavos,
      alojamiento_centavos, alimentacion_centavos, regimen_alimentacion,
      tarifa_alimentacion_version, desglose_json, request_hash, expires_at
    ) VALUES ('COT-FOOD', ?, 'alojamiento-base', 1, 'ARS', '2099-01-01', '2099-01-02', 2,
      11500000, 3450000, 11500000, 7500000, 4000000, 'pension_completa', 1,
      '{"precio_comida_centavos":2000000}', 'hash-food', '2099-01-01T00:15:00Z')
  `).run(planId);
  db.prepare("UPDATE tarifas_alimentacion SET estado = 'retirado' WHERE codigo = 'pension_completa'").run();
  db.prepare(`
    INSERT INTO tarifas_alimentacion (
      codigo, moneda, version, precio_comida_centavos,
      comidas_adicionales_por_persona_noche, estado, publicado_at
    ) VALUES ('pension_completa', 'ARS', 2, 2500000, 2, 'publicado', '2098-01-01T00:00:00Z')
  `).run();

  const snapshot = db.prepare(`
    SELECT tarifa_alimentacion_version, alimentacion_centavos, desglose_json
    FROM cotizaciones WHERE codigo = 'COT-FOOD'
  `).get();
  assert.equal(snapshot?.tarifa_alimentacion_version, 1);
  assert.equal(snapshot?.alimentacion_centavos, 4_000_000);
  assert.match(String(snapshot?.desglose_json), /2000000/);
  db.close();
});

test('guarda snapshots monetarios válidos y enlaza como máximo una reserva', () => {
  const db = baseConTarifas();
  const planId = Number(db.prepare("SELECT id FROM planes_tarifa WHERE codigo = 'alojamiento-base'").get()?.id);
  const quoteId = Number(db.prepare(`
    INSERT INTO cotizaciones (
      codigo, plan_tarifa_id, plan_codigo, plan_version, moneda,
      fecha_checkin, fecha_checkout, cantidad_personas,
      subtotal_centavos, sena_centavos, total_centavos,
      alojamiento_centavos, alimentacion_centavos,
      desglose_json, request_hash, expires_at
    ) VALUES ('COT-1', ?, 'alojamiento-base', 1, 'ARS', '2099-01-01', '2099-01-02', 2,
      7500000, 2250000, 7500000, 7500000, 0, '{"noches":1}', 'hash-1', '2099-01-01T00:15:00Z')
    RETURNING id
  `).get(planId)?.id);

  assert.ok(quoteId > 0);
  assert.throws(() => db.prepare(`
    INSERT INTO cotizaciones (
      codigo, plan_tarifa_id, plan_codigo, plan_version, moneda,
      fecha_checkin, fecha_checkout, cantidad_personas,
      subtotal_centavos, sena_centavos, total_centavos,
      alojamiento_centavos, alimentacion_centavos,
      desglose_json, request_hash, expires_at
    ) VALUES ('COT-2', ?, 'alojamiento-base', 1, 'ARS', '2099-01-01', '2099-01-02', 2,
      10, 11, 10, 10, 0, '{}', 'hash-2', '2099-01-01T00:15:00Z')
  `).run(planId), /CHECK constraint failed/);
  db.close();
});

test('impide modificar o eliminar un plan publicado', () => {
  const db = baseConTarifas();
  assert.throws(() => db.prepare("UPDATE planes_tarifa SET nombre = 'otro' WHERE codigo = 'alojamiento-base'").run(), /immutable/);
  assert.throws(() => db.prepare("DELETE FROM planes_tarifa WHERE codigo = 'alojamiento-base'").run(), /immutable/);
  assert.throws(() => db.prepare("UPDATE reglas_precio SET importe_centavos = 1 WHERE id = 1").run(), /immutable/);
  assert.throws(() => db.prepare("DELETE FROM reglas_sena WHERE id = 1").run(), /immutable/);
  db.prepare("UPDATE planes_tarifa SET estado = 'retirado' WHERE codigo = 'alojamiento-base'").run();
  assert.equal(db.prepare("SELECT estado FROM planes_tarifa WHERE codigo = 'alojamiento-base'").get()?.estado, 'retirado');
  db.close();
});
