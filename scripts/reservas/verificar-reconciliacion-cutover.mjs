import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function leerControles(texto) {
  const inicio = [...texto].map((caracter, indice) => ({ caracter, indice }))
    .find(({ caracter }) => caracter === '[' || caracter === '{')?.indice;
  assert.notEqual(inicio, undefined, 'Wrangler no devolvió JSON de reconciliación');
  const payload = JSON.parse(texto.slice(inicio));
  const bloques = Array.isArray(payload) ? payload : [payload];
  const controles = new Map();
  for (const bloque of bloques) {
    for (const fila of bloque.results || bloque.result || []) {
      if (fila?.control != null) controles.set(String(fila.control), String(fila.valor));
    }
  }
  assert.ok(controles.size > 0, 'La reconciliación no devolvió controles');
  return controles;
}

export function verificarReconciliacion(antes, despues) {
  const inmutables = [
    'reservas_total', 'consultas_total', 'usuarios_admin_total', 'auditoria_admin_total',
    'reservas_monto_total', 'reservas_sena_total',
  ];
  for (const clave of new Set([...antes.keys(), ...despues.keys()])) {
    if (clave.startsWith('reservas_estado:')) inmutables.push(clave);
  }
  for (const clave of inmutables) {
    assert.equal(despues.get(clave), antes.get(clave), `Cambió el control ${clave}`);
  }
  for (const clave of ['reservas_invalidas', 'mp_preference_duplicados', 'mp_payment_duplicados']) {
    assert.equal(despues.get(clave), '0', `${clave} debe quedar en cero`);
  }
  assert.ok(
    Number.parseInt(despues.get('super_admin_activo_total') || '0', 10) >= 1,
    'Debe existir al menos un usuario super_admin activo'
  );
  return { controlesComparados: new Set(inmutables).size, resultado: 'ok' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv.length, 4, 'Uso: verificar-reconciliacion-cutover.mjs antes.json despues.json');
  const antes = leerControles(readFileSync(process.argv[2], 'utf8'));
  const despues = leerControles(readFileSync(process.argv[3], 'utf8'));
  console.log(JSON.stringify({ event: 'cutover.reconciliation.completed', ...verificarReconciliacion(antes, despues) }));
}
