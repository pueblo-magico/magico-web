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
    { reservationId: 42 },
    {
      resolverEventIds: async (_env, objetivo) => {
        assert.deepEqual(objetivo, { reservationId: 42 });
        return ['reserva:test-42'];
      },
      despachar: async (_env, eventIds) => {
        ejecuciones++;
        assert.deepEqual(eventIds, ['reserva:test-42']);
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
  assert.equal(programarDespachoOutbox(
    envConfigurado, undefined, 'test', { eventIds: ['evento:test'] }
  ), false);
  assert.equal(programarDespachoOutbox(
    { ...envConfigurado, INTEGRATION_OUTBOX_ENABLED: 'false' },
    () => undefined,
    'test',
    { eventIds: ['evento:test'] }
  ), false);
});

test('una falla de n8n se absorbe dentro de la tarea de segundo plano', async () => {
  let tarea: Promise<unknown> | undefined;
  const errores: string[] = [];

  const programado = programarDespachoOutbox(
    envConfigurado,
    promesa => { tarea = promesa; },
    'test.failure',
    { eventIds: ['evento:falla'] },
    {
      resolverEventIds: async (_env, objetivo) => 'eventIds' in objetivo ? objetivo.eventIds : [],
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

test('no ejecuta un lote global cuando el objetivo no produjo eventos', async () => {
  let tarea: Promise<unknown> | undefined;
  let ejecuciones = 0;
  const programado = programarDespachoOutbox(
    envConfigurado,
    promesa => { tarea = promesa; },
    'test.empty',
    { eventIds: [] },
    {
      resolverEventIds: async () => [],
      despachar: async () => {
        ejecuciones++;
        return { reclamados: 0, entregados: 0, reprogramados: 0, deadLetter: 0 };
      },
      logger: { info: () => undefined, error: () => undefined },
    }
  );

  assert.equal(programado, true);
  assert.ok(tarea);
  await tarea;
  assert.equal(ejecuciones, 0);
});

test('resuelve solamente la intención de confirmación de la reserva indicada', async () => {
  let tarea: Promise<unknown> | undefined;
  let consulta = '';
  let valores: unknown[] = [];
  let entregados: string[] = [];
  const env = {
    ...envConfigurado,
    DB: {
      prepare(query: string) {
        consulta = query;
        return {
          bind(...bindings: unknown[]) {
            valores = bindings;
            return this;
          },
          async all() {
            return { results: [{ event_id: 'comunicacion:confirmacion-42' }] };
          },
        };
      },
    },
  };

  const programado = programarDespachoOutbox(
    env,
    promesa => { tarea = promesa; },
    'test.reservation.confirm',
    { reservationId: 42, communicationIntentTypes: ['pago_aprobado'] },
    {
      despachar: async (_env, eventIds) => {
        entregados = eventIds;
        return { reclamados: 1, entregados: 1, reprogramados: 0, deadLetter: 0 };
      },
      logger: { info: () => undefined, error: () => undefined },
    }
  );

  assert.equal(programado, true);
  assert.ok(tarea);
  await tarea;
  assert.match(consulta, /event_type = 'comunicacion\.intencion_creada'/);
  assert.match(consulta, /\$\.intent_type/);
  assert.deepEqual(valores, [42, 'pago_aprobado']);
  assert.deepEqual(entregados, ['comunicacion:confirmacion-42']);
});
