import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  checkPublicAvailability,
  createBookingAttemptKey,
  createPublicReservation,
  formatRemaining,
  getPublicReservationStatus,
  localTodayIso,
  remainingSeconds,
} from '../../components/booking/bookingApi.ts';

test('la carga de alojamientos no se cancela al activar su propio indicador', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /\}, \[open, optionsLoaded, c\.noOptions, language\]\);/);
  assert.doesNotMatch(source, /\[open, optionsLoaded, loadingOptions/);
});

test('muestra el flujo en un modal accesible en todos los tamaños y protege los datos de pago', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../components/BookingWidget.css', import.meta.url), 'utf8');
  assert.match(source, /open && createPortal/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /document\.body\.style\.overflow = 'hidden'/);
  assert.doesNotMatch(source, /booking-inline/);
  assert.doesNotMatch(source, /mobileFlow/);
  assert.match(source, /className="booking-payment__identifier"/);
  assert.match(styles, /\.booking-result a\.booking-button\s*\{[^}]*color:\s*#fff/s);
  assert.match(styles, /\.booking-payment__identifier\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(source, /reservation\.pago\?\.estado === 'ready'/);
  assert.match(source, /href=\{reservation\.pago\.checkout_url\}/);
  assert.match(source, /reservation\.transferencia\?\.estado === 'ready'/);
  assert.match(source, /Esperando acreditación/);
});

test('los retornos de Mercado Pago consultan el estado persistido y tienen fallback SPA', () => {
  const source = readFileSync(new URL('../../src/EstadoPagoReserva.tsx', import.meta.url), 'utf8');
  const redirects = readFileSync(new URL('../../public/_redirects', import.meta.url), 'utf8');
  assert.match(source, /getPublicReservationStatus\(code\)/);
  assert.match(source, /status\?\.reserva\.estado === 'confirmada'/);
  assert.doesNotMatch(source, /params\.get\(['"]status['"]\)/);
  for (const path of ['/reserva-confirmada', '/reserva-pendiente', '/reserva-fallida']) {
    assert.match(redirects, new RegExp(`${path}\\s+/app-shell/\\s+200`));
  }
});

test('el widget actualiza una reserva pendiente y retira las instrucciones de pago al confirmarse', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /getPublicReservationStatus\(code\)/);
  assert.match(source, /window\.setInterval\(refreshStatus, 10_000\)/);
  assert.match(source, /document\.addEventListener\('visibilitychange', onVisibilityChange\)/);
  assert.match(source, /reservationConfirmed \? c\.confirmedTitle/);
  assert.match(source, /reservationConfirmed \? \(/);
  assert.match(source, /reservationPending && \(reservation\.pago\?\.estado/);
  assert.match(source, /reservationPending && reservation\.transferencia\?\.estado === 'ready'/);
});

test('conserva una reserva activa sin PII y muestra acceso persistente al cerrar el modal', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../components/BookingWidget.css', import.meta.url), 'utf8');
  assert.match(source, /magico\.active-reservation\.v1/);
  assert.match(source, /writeActiveReservation/);
  assert.match(source, /readActiveReservation/);
  assert.match(source, /clearActiveReservation/);
  assert.match(source, /!open && viewportEligible && reservation && \(/);
  assert.match(source, /booking-active-reservation/);
  assert.match(source, /\/reserva-pendiente/);
  assert.match(source, /if \(!viewportEligible \|\| !code/);
  assert.doesNotMatch(source, /context:\s*\{[^}]*guest/s);
  assert.doesNotMatch(source, /context:\s*\{[^}]*payerDni/s);
  assert.match(styles, /\.booking-active-reservation\s*\{[^}]*position:\s*fixed/s);
});

test('oculta el encabezado promocional mientras el checkout está abierto', () => {
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../../components/HeroNuevo.tsx', import.meta.url), 'utf8');
  const stay = readFileSync(new URL('../../src/Estadia.tsx', import.meta.url), 'utf8');

  assert.match(widget, /onOpenChange\?\.\(open\)/);
  assert.match(home, /!desktopBookingOpen && <div/);
  assert.match(home, /<BookingWidget compact activeViewport="mobile" onOpenChange=\{setCompactBookingOpen\}/);
  assert.match(home, /<BookingWidget activeViewport="desktop" onOpenChange=\{setDesktopBookingOpen\}/);
  assert.match(stay, /!bookingOpen && <div/);
  assert.match(stay, /<BookingWidget onOpenChange=\{setBookingOpen\}/);
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
      paymentMethod: 'mercado_pago_checkout',
      idempotencyKey: 'web-reserva-qa',
    });
    assert.equal(requestedUrl, '/api/v1/public/reservas');
    assert.equal(new Headers(requestedInit?.headers).get('Idempotency-Key'), 'web-reserva-qa');
    assert.deepEqual(JSON.parse(String(requestedInit?.body)), {
      cotizacion_codigo: 'COT-QA',
      espacio_codigo: 'domo-1',
      cliente: { nombre: 'Persona QA', telefono: '+5493510000000', email: null },
      pago: { metodo: 'mercado_pago_checkout' },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('consulta el estado público por código opaco sin enviar credenciales', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async input => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      data: {
        reserva: { codigo: 'RES-123', estado: 'confirmada', expires_at: null },
        pago: { proveedor: 'mercado_pago', estado: 'aprobado' },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const status = await getPublicReservationStatus('RES-123');
    assert.equal(requestedUrl, '/api/v1/public/reservas/RES-123');
    assert.equal(status.reserva.estado, 'confirmada');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
