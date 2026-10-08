import assert from 'node:assert/strict';

const base = String(process.env.PRODUCTION_BASE_URL || '').replace(/\/$/, '');
assert.match(base, /^https:\/\//, 'PRODUCTION_BASE_URL debe ser una URL HTTPS');

async function verificar(path, esperado, opciones) {
  const response = await fetch(`${base}${path}`, opciones);
  assert.equal(response.status, esperado, `${path} respondió HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /application\/json/i, `${path} no devolvió JSON`);
}

await verificar('/api/v1/public/alojamientos?contexto=general', 200);
await verificar('/api/admin/me', 401);
await verificar('/api/webhook-mp', 401, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});

console.log(JSON.stringify({
  event: 'cutover.production_smoke.completed',
  public_reservations: true,
  admin_protected: true,
  payment_webhook_protected: true,
}));
