import assert from 'node:assert/strict';
import test from 'node:test';

import {
  onRequestGet as disponibilidad,
  onRequestOptions as opcionesDisponibilidad,
} from '../../functions/api/disponibilidad.ts';
import { onRequestGet as sesionAdmin } from '../../functions/api/admin/me.ts';
import { onRequestPost as manyChat } from '../../functions/api/manychat.ts';
import { onRequestPost as webhookMercadoPago } from '../../functions/api/webhook-mp.ts';

const dbRateLimit = {
  prepare() {
    return {
      bind() { return this; },
      async first() { return { cantidad: 1 }; },
    };
  },
};

test('contrato público devuelve JSON, CORS y correlación para un rango inválido', async () => {
  const response = await disponibilidad({
    request: new Request('https://test/api/disponibilidad?desde=no&hasta=2026-11-13', {
      headers: { Origin: 'https://experienciamagico.com', 'X-Request-ID': 'contract-public-1' },
    }),
    env: { DB: dbRateLimit },
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://experienciamagico.com');
  assert.equal(response.headers.get('X-Request-ID'), 'contract-public-1');
  assert.deepEqual(Object.keys(await response.json()), ['error']);
});

test('contrato público responde el preflight CORS sin consultar datos', async () => {
  const response = await opcionesDisponibilidad({
    request: new Request('https://test/api/disponibilidad', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    }),
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
});

test('contrato administrativo no expone datos sin sesión', async () => {
  const response = await sesionAdmin({
    request: new Request('https://test/api/admin/me', {
      headers: { 'X-Request-ID': 'contract-admin-1' },
    }),
    env: { SESSION_SECRET: 'session-secret-seguro-de-al-menos-32-caracteres' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('X-Request-ID'), 'contract-admin-1');
  assert.deepEqual(await response.json(), { error: 'No autenticado.' });
});

test('contrato de integración rechaza credenciales ausentes antes de procesar datos', async () => {
  const response = await manyChat({
    request: new Request('https://test/api/manychat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'contract-integration-1' },
      body: JSON.stringify({ cliente_email: 'no-debe-registrarse@example.test' }),
    }),
    env: {},
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('X-Request-ID'), 'contract-integration-1');
  assert.deepEqual(await response.json(), { error: 'No autorizado.' });
});

test('contrato de webhook rechaza una firma ausente y conserva correlación', async () => {
  const response = await webhookMercadoPago({
    request: new Request('https://test/api/webhook-mp?data.id=payment-1', {
      method: 'POST',
      headers: { 'X-Request-ID': 'contract-webhook-1' },
    }),
    env: { DB: dbRateLimit, MP_WEBHOOK_SECRET: 'webhook-secret' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('X-Request-ID'), 'contract-webhook-1');
  assert.equal(await response.text(), 'Firma inválida');
});

test('contrato de webhook acepta firma válida y consulta el pago sin exponer su payload', async () => {
  const secret = 'webhook-secret-contractual';
  const paymentId = 'payment-contract-2';
  const requestId = 'contract-webhook-2';
  const timestamp = '1700000000';
  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const signature = [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    id: paymentId,
    status: 'approved',
    external_reference: 'referencia-no-numerica',
  }), { status: 200 });

  try {
    const response = await webhookMercadoPago({
      request: new Request(`https://test/api/webhook-mp?data.id=${paymentId}`, {
        method: 'POST',
        headers: {
          'X-Request-ID': requestId,
          'x-signature': `ts=${timestamp},v1=${signature}`,
        },
      }),
      env: { DB: dbRateLimit, MP_WEBHOOK_SECRET: secret, MP_ACCESS_TOKEN: 'token-de-prueba' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Request-ID'), requestId);
    assert.equal(await response.text(), 'OK');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
