import assert from 'node:assert/strict';

const base = String(process.env.PRODUCTION_BASE_URL || '').replace(/\/$/, '');
assert.match(base, /^https:\/\//, 'PRODUCTION_BASE_URL debe ser una URL HTTPS');

async function verificar(path, esperado, opciones) {
  const response = await fetch(`${base}${path}`, opciones);
  assert.equal(response.status, esperado, `${path} respondió HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /application\/json/i, `${path} no devolvió JSON`);
}

async function verificarHtml(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'follow' });
  assert.equal(response.status, 200, `${path} respondió HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /text\/html/i, `${path} no devolvió HTML`);
}

await verificar('/api/v1/public/alojamientos?contexto=general', 200);
await verificar('/api/admin/me', 401);
await verificarHtml('/admin/reservas/');
await verificarHtml('/boton-de-arrepentimiento/');
await verificar('/api/v1/integrations/reservas/expirar-retenciones', 401, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});
await verificar('/api/v1/integrations/outbox/dispatch', 401, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});
await verificar('/api/webhook-mp', 401, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});

console.log(JSON.stringify({
  event: 'cutover.production_smoke.completed',
  public_reservations: true,
  admin_panel: true,
  admin_protected: true,
  operational_jobs_protected: true,
  withdrawal_surface: true,
  payment_webhook_protected: true,
}));
