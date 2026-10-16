import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  checkPublicAvailability,
  createBookingAttemptKey,
  createPublicReservation,
  formatRemaining,
  getPublicReservationStatus,
  listPublicAccommodations,
  localTodayIso,
  remainingSeconds,
} from '../../components/booking/bookingApi.ts';

test('rechaza una respuesta inválida del catálogo público sin romper el widget', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  try {
    await assert.rejects(
      listPublicAccommodations(),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'RESPUESTA_INVALIDA',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('la carga de alojamientos no se cancela al activar su propio indicador', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /\}, \[open, optionsLoaded, c\.noOptions, language\]\);/);
  assert.doesNotMatch(source, /\[open, optionsLoaded, loadingOptions/);
});

test('incluye camping cuando el catálogo público lo habilita', () => {
  const api = readFileSync(new URL('../../components/booking/bookingApi.ts', import.meta.url), 'utf8');
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(api, /AccommodationType = 'domo' \| 'refugio' \| 'camping'/);
  assert.match(api, /BookingMode = 'compartida' \| 'privada' \| 'camping'/);
  assert.match(widget, /\['domo', 'refugio', 'camping'\] as const/);
  assert.match(widget, /\['compartida', 'privada', 'camping'\] as const/);
  assert.match(widget, /campoentero\.webp/);
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

test('exige email para crear una reserva desde el flujo público', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  assert.match(source, /autoComplete="email" required/);
  assert.match(source, /!guest\.email\.trim\(\)/);
  assert.doesNotMatch(source, /\{c\.email\}\s*<small>\{c\.optional\}/);
});

test('el widget embebido conserva un lanzador compacto sin duplicar el hero', () => {
  const source = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../components/BookingWidget.css', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../../components/HeroNuevo.tsx', import.meta.url), 'utf8');

  assert.match(source, /data-compact=\{compact \|\| undefined\}/);
  assert.match(styles, /\.booking-launcher\[data-compact\][^{]*\{[^}]*background:\s*rgba\(255, 255, 255, \.97\)/s);
  assert.match(styles, /\.booking-launcher\[data-compact\][^{]*\.booking-launcher__content\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.booking-launcher\[data-compact\][^{]*\.booking-button\s*\{[^}]*width:\s*100%/s);
  assert.match(home, /<BookingWidget compact activeViewport="mobile"/);
  assert.match(home, /<BookingWidget compact activeViewport="desktop"/);
});

test('los CTA que prometen reservar entran al flujo y no abren una conversación', () => {
  const config = readFileSync(new URL('../../src/data/config.ts', import.meta.url), 'utf8');
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const content = JSON.parse(readFileSync(new URL('../../data.json', import.meta.url), 'utf8'));
  const reservationViews = [
    '../../src/Estadia.tsx',
    '../../src/Coliving.tsx',
    '../../src/AlmaDeLobo.tsx',
    '../../src/Despertar.tsx',
    '../../src/IntiRaymi.tsx',
    '../../src/KillaRaymi.tsx',
    '../../src/PachamamaFest.tsx',
    '../../src/CicloVitalFemenino.tsx',
    '../../src/CordobaFlyFishing.tsx',
    '../../src/VueloDelCondor.tsx',
    '../../src/Familion.tsx',
    '../../src/Gondorbows.tsx',
    '../../src/components/AchalaVivaHero.tsx',
    '../../src/components/AulaVerdePrecios.tsx',
    '../../src/components/CicloVitalFemeninoHero.tsx',
    '../../src/components/GondorbowsHero.tsx',
    '../../src/components/GondorbowsPrecios.tsx',
    '../../src/components/VueloDelCondorPrecios.tsx',
    '../../src/components/VueloDelCondorInversion.tsx',
    '../../src/components/FamilionHero.tsx',
    '../../src/components/FamilionPrecios.tsx',
  ];

  assert.match(config, /RESERVATION_START_PATH = '\/estadia\?reservar=1'/);
  assert.match(widget, /useState\(shouldOpenFromReservationLink\)/);
  assert.match(widget, /get\('reservar'\) === '1'/);
  assert.equal(content.es.menu.bookLink, '/estadia?reservar=1');
  assert.equal(content.en.menu.bookLink, '/estadia?reservar=1');
  assert.equal(content.es.experiences.link, '/estadia?reservar=1');
  assert.equal(content.en.experiences.link, '/estadia?reservar=1');
  for (const path of reservationViews) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /RESERVATION_START_PATH/, `${path} debe usar la entrada canónica de reserva`);
  }
});

test('los retornos de Mercado Pago consultan el estado persistido y tienen fallback SPA', () => {
  const source = readFileSync(new URL('../../src/EstadoPagoReserva.tsx', import.meta.url), 'utf8');
  const redirects = readFileSync(new URL('../../public/_redirects', import.meta.url), 'utf8');
  assert.match(source, /getPublicReservationStatus\(code\)/);
  assert.match(source, /status\?\.reserva\.estado === 'confirmada'/);
  assert.match(source, /status\.pago\.checkout_url/);
  assert.match(source, /status\?\.transferencia\.estado === 'ready'/);
  assert.match(source, /activePending && status/);
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
  assert.match(source, /reservationConfirmed\s*\?\s*c\.confirmedTitle/);
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
  assert.match(source, /<FloatingUiPortal surface="reservation">/);
  assert.match(source, /booking-active-reservation/);
  assert.match(source, /\/reserva-pendiente/);
  assert.match(source, /if \(!viewportEligible \|\| !code/);
  assert.match(source, /reservationExpired = Boolean/);
  assert.match(source, /remainingSeconds\(reservation\.reserva\.expires_at\) === 0/);
  assert.match(source, /reservationExpired && <button className="booking-active-reservation__discard"/);
  assert.match(source, /reservationExpired\s*\?\s*c\.expiredTitle/);
  assert.doesNotMatch(source, /context:\s*\{[^}]*guest/s);
  assert.doesNotMatch(source, /context:\s*\{[^}]*payerDni/s);
  assert.match(styles, /\.booking-active-reservation\s*\{[^}]*width:\s*100%/s);
});

test('apila las superficies flotantes y mantiene WhatsApp accesible debajo de la reserva', () => {
  const context = readFileSync(new URL('../../components/FloatingUiContext.tsx', import.meta.url), 'utf8');
  const stackStyles = readFileSync(new URL('../../components/FloatingUiContext.css', import.meta.url), 'utf8');
  const root = readFileSync(new URL('../../index.tsx', import.meta.url), 'utf8');
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const pwa = readFileSync(new URL('../../components/PWAInstallBanner.tsx', import.meta.url), 'utf8');
  const whatsapp = readFileSync(new URL('../../components/WhatsAppButton.tsx', import.meta.url), 'utf8');
  const cookies = readFileSync(new URL('../../components/CookieBanner.tsx', import.meta.url), 'utf8');

  assert.match(context, /'cookie' \| 'pwa' \| 'reservation' \| 'whatsapp'/);
  assert.match(context, /createPortal/);
  assert.match(context, /className="floating-ui-stack"/);
  assert.match(root, /<FloatingUiProvider>/);
  assert.match(widget, /<FloatingUiPortal surface="reservation">/);
  assert.match(pwa, /<FloatingUiPortal surface="pwa">/);
  assert.match(cookies, /<FloatingUiPortal surface="cookie">/);
  assert.match(whatsapp, /<FloatingUiPortal surface="whatsapp">/);
  assert.doesNotMatch(whatsapp, /if \(activeSurface\) return null/);
  assert.match(whatsapp, /origin-bottom-right/);
  assert.match(stackStyles, /\.floating-ui-stack\s*\{[^}]*position:\s*fixed[^}]*flex-direction:\s*column/s);
  assert.doesNotMatch(stackStyles, /overflow-[xy]:\s*(auto|scroll)/);
  assert.match(stackStyles, /\.floating-ui-stack__item--reservation\s*\{\s*order:\s*30/);
  assert.match(stackStyles, /\.floating-ui-stack__item--whatsapp\s*\{[^}]*order:\s*40/s);
});

test('mantiene sincronizada la página pública cuando vence la retención', () => {
  const source = readFileSync(new URL('../../src/EstadoPagoReserva.tsx', import.meta.url), 'utf8');
  assert.match(source, /remainingSeconds\(status\.reserva\.expires_at, now\) === 0/);
  assert.match(source, /expired \? c\.expired/);
  assert.match(source, /window\.setInterval\(tick, 1000\)/);
});

test('ubica el botón de arrepentimiento debajo de los widgets de reserva principales', () => {
  const access = readFileSync(new URL('../../components/WithdrawalAccessLink.tsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../../components/HeroNuevo.tsx', import.meta.url), 'utf8');
  const stay = readFileSync(new URL('../../src/Estadia.tsx', import.meta.url), 'utf8');
  assert.match(access, /embedded\?: boolean/);
  assert.match(access, /location\.pathname === '\/' \|\| location\.pathname === ROUTES\.ESTADIA/);
  assert.equal((home.match(/<WithdrawalAccessLink embedded inverse \/>/g) || []).length, 2);
  assert.match(stay, /<WithdrawalAccessLink embedded \/>/);
});

test('evita encabezados promocionales redundantes en los accesos a la reserva', () => {
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../../components/HeroNuevo.tsx', import.meta.url), 'utf8');
  const stay = readFileSync(new URL('../../src/Estadia.tsx', import.meta.url), 'utf8');

  assert.match(widget, /onOpenChange\?\.\(open\)/);
  assert.match(home, /!desktopBookingOpen && <div/);
  assert.match(home, /<BookingWidget compact activeViewport="mobile" onOpenChange=\{setCompactBookingOpen\}/);
  assert.match(home, /<BookingWidget compact activeViewport="desktop" onOpenChange=\{setDesktopBookingOpen\}/);
  assert.match(stay, /<BookingWidget \/>/);
  assert.doesNotMatch(stay, /RESERVÁ TU LUGAR/);
  assert.doesNotMatch(stay, /bookingOpen/);
});

test('la página de estadía y la portada usan el plan tarifario público en vez de precios legacy', () => {
  const stay = readFileSync(new URL('../../src/Estadia.tsx', import.meta.url), 'utf8');
  const inclusions = readFileSync(new URL('../../components/SectionInclusiones.tsx', import.meta.url), 'utf8');
  const hero = readFileSync(new URL('../../components/HeroNuevo.tsx', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../../components/booking/bookingApi.ts', import.meta.url), 'utf8');
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');

  assert.match(stay, /usePublicPricingSummary/);
  assert.match(inclusions, /usePublicPricingSummary/);
  assert.match(hero, /usePublicPricingSummary/);
  assert.match(api, /\/api\/v1\/public\/precios/);
  assert.match(widget, /usePublicPricingSummary/);
  assert.match(widget, /usePublicPricingSummaries/);
  assert.match(widget, /estimateBookingPrice/);
  assert.match(widget, /c\.perPerson/);
  assert.doesNotMatch(stay, /Desde \$20\.000/);
  assert.match(stay, /textoTarifasPublicadas\(precios, cargado\)/);
  assert.match(stay, /textoPensionCompleta\(precios, cargado\)/);
  assert.match(stay, /<HorariosPension precios=\{preciosPublicos\} cargado=\{preciosCargados\} \/>/);
  assert.doesNotMatch(stay, /Tarifa base: desde \$20\.000/);
  assert.doesNotMatch(stay, /\+\$20\.000 cada uno/);
  assert.doesNotMatch(stay, /\$45\.000 camping \/ \$60\.000/);
  assert.doesNotMatch(inclusions, /ESTADIA_PRICES/);
  assert.doesNotMatch(hero, /\(t\.hero as any\)\.reservationPricing/);
  assert.doesNotMatch(widget, /Desde \$20\.000/);
});

test('adapta el acceso a reserva a columnas angostas y distingue precios desde de totales seleccionados', () => {
  const stay = readFileSync(new URL('../../src/Estadia.tsx', import.meta.url), 'utf8');
  const widget = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../components/BookingWidget.css', import.meta.url), 'utf8');

  assert.match(stay, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,340px\)\]/);
  assert.match(stay, /id="reservar" className="order-first min-w-0 max-w-full/);
  assert.match(styles, /\.booking-widget\s*\{[^}]*min-width:\s*0[^}]*container-type:\s*inline-size/s);
  assert.match(styles, /@container \(max-width: 420px\)/);
  assert.match(widget, /priceIsExact \|\| \(step > 1 && priceIsStayEstimate\)/);
  assert.match(widget, /stayDates\.length > 0 \? c\.fromTotal : c\.fromNight/);
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
      guest: { name: 'Persona QA', phone: '+5493510000000', email: 'persona@example.test' },
      paymentMethod: 'mercado_pago_checkout',
      idempotencyKey: 'web-reserva-qa',
    });
    assert.equal(requestedUrl, '/api/v1/public/reservas');
    assert.equal(new Headers(requestedInit?.headers).get('Idempotency-Key'), 'web-reserva-qa');
    assert.deepEqual(JSON.parse(String(requestedInit?.body)), {
      cotizacion_codigo: 'COT-QA',
      espacio_codigo: 'domo-1',
      cliente: { nombre: 'Persona QA', telefono: '+5493510000000', email: 'persona@example.test' },
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
