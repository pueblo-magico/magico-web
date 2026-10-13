import assert from 'node:assert/strict';
import test from 'node:test';

import { programarDespachoOutbox } from '../../functions/_interfaces/http/backgroundOutboxDispatch.ts';

const envConfigurado = {
  DB: {},
  INTEGRATION_OUTBOX_ENABLED: 'true',
  INTEGRATION_EVENTS_WEBHOOK_URL: 'https://n8n.example.test/webhook/reservas',
  INTEGRATION_EVENTS_WEBHOOK_SECRET: 'x'.repeat(32),
};

test('programa el despacho en segundo plano cuando la integración está configurada', async () => {
  let tarea: Promise<unknown> | undefined;
  let ejecuciones = 0;
  const logs: string[] = [];

  const programado = programarDespachoOutbox(
    envConfigurado,
    promesa => { tarea = promesa; },
    'test.reservation.create',
    {
      despachar: async () => {
        ejecuciones++;
        return { reclamados: 2, entregados: 2, reprogramados: 0, deadLetter: 0 };
      },
      logger: { info: mensaje => logs.push(String(mensaje)), error: mensaje => logs.push(String(mensaje)) },
    }
  );

  assert.equal(programado, true);
  assert.ok(tarea);
  await tarea;
  assert.equal(ejecuciones, 1);
  assert.match(logs[0], /outbox_despacho_inmediato_completado/);
  assert.match(logs[0], /test\.reservation\.create/);
});

test('no programa sin waitUntil o con el outbox desactivado', () => {
  assert.equal(programarDespachoOutbox(envConfigurado, undefined, 'test'), false);
  assert.equal(programarDespachoOutbox(
    { ...envConfigurado, INTEGRATION_OUTBOX_ENABLED: 'false' },
    () => undefined,
    'test'
  ), false);
});

test('una falla de n8n se absorbe dentro de la tarea de segundo plano', async () => {
  let tarea: Promise<unknown> | undefined;
  const errores: string[] = [];

  const programado = programarDespachoOutbox(
    envConfigurado,
    promesa => { tarea = promesa; },
    'test.failure',
    {
      despachar: async () => {
        throw Object.assign(new Error('No autorizado'), { codigo: 'INTEGRATION_HTTP_401' });
      },
      logger: { info: () => undefined, error: mensaje => errores.push(String(mensaje)) },
    }
  );

  assert.equal(programado, true);
  assert.ok(tarea);
  await assert.doesNotReject(tarea);
  assert.match(errores[0], /INTEGRATION_HTTP_401/);
  assert.doesNotMatch(errores[0], /No autorizado/);
});
