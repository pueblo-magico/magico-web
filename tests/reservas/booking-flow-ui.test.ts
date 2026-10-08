import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  checkPublicAvailability,
  createBookingAttemptKey,
  createPublicReservation,
  formatRemaining,
  localTodayIso,
  remainingSeconds,
} from '../../components/booking/bookingApi.ts';

test('la carga de alojamientos no se cancela al activar su propio indicador', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /\}, \[open, optionsLoaded, c\.noOptions, language\]\);/);
  assert.doesNotMatch(source, /\[open, optionsLoaded, loadingOptions/);
});

test('mantiene el flujo dentro del widget en escritorio y protege los datos de pago', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../components/BookingWidget.css', import.meta.url), 'utf8');
  assert.match(source, /open && !mobileFlow && <div className="booking-inline">/);
  assert.match(source, /open && mobileFlow && createPortal/);
  assert.match(source, /className="booking-payment__identifier"/);
  assert.match(styles, /\.booking-result a\.booking-button\s*\{[^}]*color:\s*#fff/s);
  assert.match(styles, /\.booking-payment__identifier\s*\{[^}]*white-space:\s*nowrap/s);
});

test('genera una clave idempotente distinta por intento de reserva web', () => {
  const first = createBookingAttemptKey();
  const second = createBookingAttemptKey();
  assert.match(first, /^web-reserva-/);
  assert.notEqual(first, second);
});

test('calcula la fecha local sin depender de UTC para el mínimo del calendario', () => {
  assert.equal(localTodayIso(new Date(2027, 3, 9, 23, 30, 0)), '2027-04-09');
});

test('muestra la vigencia de cotización y retención como reloj decreciente', () => {
  const now = Date.parse('2027-04-09T12:00:00.000Z');
  assert.equal(remainingSeconds('2027-04-09T12:15:00.000Z', now), 900);
  assert.equal(formatRemaining(900), '15:00');
  assert.equal(remainingSeconds('2027-04-09T11:59:00.000Z', now), 0);
});

test('consulta disponibilidad usando solamente el contrato público v1', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async input => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ data: { estado: 'disponible' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const available = await checkPublicAvailability({
      check_in: '2027-04-10', check_out: '2027-04-12', personas: 2,
      tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      regimen_alimentacion: 'desayuno_incluido',
    });
    assert.equal(available, true);
    assert.match(requestedUrl, /^\/api\/v1\/public\/disponibilidad\?/);
    assert.match(requestedUrl, /check_in=2027-04-10/);
    assert.match(requestedUrl, /modalidad=privada/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('envía la clave idempotente y los datos mínimos al crear una reserva', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return new Response(JSON.stringify({
      data: {
        reserva: { codigo: 'RES-QA', estado: 'pendiente_pago', expires_at: '2027-04-10T12:15:00.000Z' },
        cotizacion_codigo: 'COT-QA',
        cuenta_cobro: { proveedor: 'manual', estado: 'pending' },
      },
      meta: { idempotente: false },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    await createPublicReservation({
      quoteCode: 'COT-QA', spaceCode: 'domo-1',
      guest: { name: 'Persona QA', phone: '+5493510000000', email: '' },
      idempotencyKey: 'web-reserva-qa',
    });
    assert.equal(requestedUrl, '/api/v1/public/reservas');
    assert.equal(new Headers(requestedInit?.headers).get('Idempotency-Key'), 'web-reserva-qa');
    assert.deepEqual(JSON.parse(String(requestedInit?.body)), {
      cotizacion_codigo: 'COT-QA',
      espacio_codigo: 'domo-1',
      cliente: { nombre: 'Persona QA', telefono: '+5493510000000', email: null },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
