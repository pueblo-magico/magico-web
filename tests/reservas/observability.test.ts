import assert from 'node:assert/strict';
import test from 'node:test';

import {
  observarSolicitud,
  obtenerRequestId,
  type LoggerObservabilidad,
} from '../../functions/_interfaces/http/observability.ts';
import {
  esRutaApi,
  handlerYaInstrumentado,
  onRequest as middlewareApi,
  operacionApi,
} from '../../functions/_middleware.ts';

function loggerCapturado() {
  const eventos: Record<string, unknown>[] = [];
  const guardar = (evento: Record<string, unknown>) => eventos.push(evento);
  const logger: LoggerObservabilidad = { info: guardar, warn: guardar, error: guardar };
  return { eventos, logger };
}

test('correlaciona una solicitud con logs estructurados sin URL, body ni PII', async () => {
  const { eventos, logger } = loggerCapturado();
  const tiempos = [100, 112];
  const request = new Request('https://test/api/reservas?email=huesped@example.test', {
    method: 'POST',
    headers: { 'X-Request-ID': 'req-seguro-1' },
    body: JSON.stringify({ cliente_email: 'huesped@example.test' }),
  });

  const response = await observarSolicitud(request, 'integration.test', async contexto => {
    contexto.setReservationId(42);
    contexto.setEventId('evt-9');
    contexto.signal('payment.processed', 'info', { metric: 'reservas_payments_total' });
    return new Response('{}', { status: 201 });
  }, logger, () => tiempos.shift() ?? 112);

  assert.equal(response.headers.get('X-Request-ID'), 'req-seguro-1');
  assert.equal(eventos.length, 2);
  assert.deepEqual(eventos[1], {
    service: 'reservas',
    event: 'http.request.completed',
    operation: 'integration.test',
    request_id: 'req-seguro-1',
    level: 'info',
    status: 201,
    duration_ms: 12,
    reservation_id: '42',
    event_id: 'evt-9',
    outcome: 'success',
    metric: 'reservas_http_requests_total',
  });
  const serializado = JSON.stringify(eventos);
  assert.doesNotMatch(serializado, /huesped@example\.test/);
  assert.doesNotMatch(serializado, /cliente_email|\/api\/reservas/);
});

test('rechaza identificadores manipulados y registra excepciones sin su mensaje', async () => {
  const request = new Request('https://test/api/test', {
    headers: { 'X-Request-ID': 'email=huesped@example.test con espacios' },
  });
  assert.doesNotMatch(obtenerRequestId(request), /email|espacios/);

  const { eventos, logger } = loggerCapturado();
  await assert.rejects(
    observarSolicitud(request, 'public.test', async () => {
      throw new Error('SQLITE detalle interno huesped@example.test');
    }, logger, () => 100),
    /SQLITE detalle interno/
  );

  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].event, 'http.request.failed');
  assert.equal(eventos[0].outcome, 'exception');
  assert.doesNotMatch(JSON.stringify(eventos[0]), /SQLITE|huesped@example\.test/);
});

test('clasifica rechazos y errores HTTP como señales operativas', async () => {
  for (const [status, level] of [[409, 'warn'], [503, 'error']] as const) {
    const { eventos, logger } = loggerCapturado();
    await observarSolicitud(
      new Request('https://test'),
      'admin.test',
      async () => new Response('{}', { status }),
      logger,
      () => 0
    );
    assert.equal(eventos[0].level, level);
    assert.equal(eventos[0].status, status);
  }
});

test('el middleware correlaciona los endpoints API que todavía no tienen instrumentación propia', async () => {
  const { eventos, logger } = loggerCapturado();
  const request = new Request('https://test/api/admin/reservas?cliente_email=no-registrar@example.test', {
    headers: { 'X-Request-ID': 'middleware-admin-1' },
  });
  const response = await middlewareApi({
    request,
    env: { OBSERVABILITY_LOGGER: logger },
    next: async () => new Response('{"ok":true}', { status: 200 }),
  });

  assert.equal(response.headers.get('X-Request-ID'), 'middleware-admin-1');
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].operation, 'admin.reservations.read');
  assert.doesNotMatch(JSON.stringify(eventos), /cliente_email|no-registrar/);
});

test('el middleware evita logs duplicados y cubre métodos no instrumentados', async () => {
  const { eventos, logger } = loggerCapturado();
  const instrumentada = new Request('https://test/api/disponibilidad', { method: 'GET' });
  assert.equal(handlerYaInstrumentado(instrumentada), true);
  const directa = await middlewareApi({
    request: instrumentada,
    env: { OBSERVABILITY_LOGGER: logger },
    next: async () => new Response(null, { status: 204, headers: { 'X-Request-ID': 'desde-handler' } }),
  });
  assert.equal(directa.headers.get('X-Request-ID'), 'desde-handler');
  assert.equal(eventos.length, 0);

  const options = new Request('https://test/api/disponibilidad', { method: 'OPTIONS' });
  assert.equal(handlerYaInstrumentado(options), false);
  const preflight = await middlewareApi({
    request: options,
    env: { OBSERVABILITY_LOGGER: logger },
    next: async () => new Response(null, { status: 204 }),
  });
  assert.ok(preflight.headers.get('X-Request-ID'));
  assert.equal(eventos[0].operation, 'public.availability');
});

test('el middleware usa una operación neutra para rutas desconocidas', () => {
  assert.equal(operacionApi(new Request('https://test/api/privado/huesped@example.test')), 'api.unknown');
});

test('el middleware raíz deja pasar archivos y páginas sin generar telemetría', async () => {
  const { eventos, logger } = loggerCapturado();
  const request = new Request('https://test/estadia');
  assert.equal(esRutaApi(request), false);
  assert.equal(esRutaApi(new Request('https://test/api')), true);
  const response = await middlewareApi({
    request,
    env: { OBSERVABILITY_LOGGER: logger },
    next: async () => new Response('página', { status: 200 }),
  });
  assert.equal(await response.text(), 'página');
  assert.equal(eventos.length, 0);
});
