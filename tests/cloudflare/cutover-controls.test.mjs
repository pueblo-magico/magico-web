import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  leerControles,
  verificarReconciliacion,
} from '../../scripts/reservas/verificar-reconciliacion-cutover.mjs';

const workflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const sql = readFileSync(new URL('../../scripts/reservas/reconciliar-cutover.sql', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../../wrangler.toml', import.meta.url), 'utf8');

test('el cutover captura bookmark y evidencia antes de migrar y reconcilia antes de desplegar', () => {
  const backup = workflow.indexOf('- name: Capture pre-cutover bookmark and reconciliation');
  const migracion = workflow.indexOf('- name: Apply production D1 migrations');
  const reconciliacion = workflow.indexOf('- name: Reconcile production data after migrations');
  const deploy = workflow.indexOf('- name: Deploy to Cloudflare Pages');
  assert.ok(backup > 0 && backup < migracion);
  assert.ok(migracion < reconciliacion && reconciliacion < deploy);
  assert.match(workflow, /d1 time-travel info DB --env production --json/);
  assert.doesNotMatch(workflow, /d1 time-travel info DB --remote/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /github\.ref_name == 'main'/);
  assert.match(workflow, /inputs\.confirm_production == 'PRODUCCION'/);
  assert.doesNotMatch(workflow, /echo .*\$\{\{\s*inputs\.release_reason/);
  assert.doesNotMatch(workflow, /test .*\$\{\{\s*inputs\.confirm_production/);
});

test('Wrangler separa explícitamente las bases de Preview y Producción', () => {
  const production = wrangler.match(/\[\[env\.production\.d1_databases\]\][\s\S]*?database_id\s*=\s*"([^"]+)"/)?.[1];
  const preview = wrangler.match(/\[\[env\.preview\.d1_databases\]\][\s\S]*?database_id\s*=\s*"([^"]+)"/)?.[1];
  assert.equal(production, '4431f6d6-052c-4f35-8fd7-4805b2d7a858');
  assert.equal(preview, 'd893fa4d-96d8-49f2-a9f5-d9feb55ab0d3');
  assert.notEqual(production, preview);
});

test('la reconciliación SQL es de sólo lectura y no selecciona PII', () => {
  assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE)\b/i);
  assert.doesNotMatch(sql, /cliente_(?:nombre|email|telefono)|documento|dni/i);
  assert.match(sql, /reservas_monto_total/);
  assert.match(sql, /reservas_estado:/);
});

test('compara conteos, estados e importes y bloquea inconsistencias', () => {
  const json = JSON.stringify([{ results: [
    { control: 'reservas_total', valor: 3 },
    { control: 'consultas_total', valor: 2 },
    { control: 'usuarios_admin_total', valor: 1 },
    { control: 'auditoria_admin_total', valor: 4 },
    { control: 'reservas_monto_total', valor: '100.00' },
    { control: 'reservas_sena_total', valor: '30.00' },
    { control: 'reservas_estado:pendiente', valor: 3 },
    { control: 'reservas_invalidas', valor: 0 },
    { control: 'mp_preference_duplicados', valor: 0 },
    { control: 'mp_payment_duplicados', valor: 0 },
  ] }]);
  const controles = leerControles(`salida previa\n${json}`);
  assert.equal(verificarReconciliacion(controles, controles).resultado, 'ok');
  const alterado = new Map(controles);
  alterado.set('reservas_total', '4');
  assert.throws(() => verificarReconciliacion(controles, alterado), /reservas_total/);
});
