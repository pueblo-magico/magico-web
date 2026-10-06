import assert from 'node:assert/strict';
import test from 'node:test';

import {
  observarSolicitud,
  obtenerRequestId,
  type LoggerObservabilidad,
} from '../../functions/_interfaces/http/observability.ts';

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
