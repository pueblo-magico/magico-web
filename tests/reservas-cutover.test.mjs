import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isRetiredReservationPath, retiredReservationResponse } from '../functions/_lib/reservasCutover.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('customer and admin entry points use standalone Reservas', () => {
  const config = read('src/data/config.ts');
  const redirects = read('public/_redirects');
  const index = read('index.tsx');
  const hero = read('components/HeroNuevo.tsx');
  const inclusions = read('components/SectionInclusiones.tsx');
  const stay = read('src/Estadia.tsx');
  const launcher = read('components/HostedBookingLauncher.tsx');
  const packageJson = JSON.parse(read('package.json'));

  assert.match(config, /https:\/\/reservas\.experienciamagico\.com/);
  assert.match(redirects, /\/reservar\s+https:\/\/reservas\.experienciamagico\.com\/reservar\?paso=fechas\s+302/);
  assert.match(redirects, /\/admin\/reservas\s+https:\/\/reservas\.experienciamagico\.com\/admin\s+302/);
  assert.doesNotMatch(index, /PanelReservas[^']*\)\s*\/>/);
  assert.match(index, /PanelSitio siteOnly/);
  assert.match(hero, /HostedBookingLauncher/);
  assert.match(stay, /HostedBookingLauncher/);
  assert.doesNotMatch(hero, /BookingWidget/);
  assert.doesNotMatch(stay, /BookingWidget|ESTADIA_PRICES|makesOffer/);
  assert.doesNotMatch(inclusions, /getEstadiaPrices|formatPrice/);
  assert.equal(packageJson.dependencies['@pueblo-magico/react-ui'], '0.7.0');
  assert.match(index, /@pueblo-magico\/react-ui\/styles\.css/);
  assert.match(launcher, /buttonVariants/);
});

test('legacy reservation endpoints fail closed but unrelated APIs continue', async () => {
  for (const path of [
    '/api/disponibilidad', '/api/cotizar', '/api/manychat', '/api/webhook-mp',
    '/api/ical', '/api/ical/2', '/api/admin/crear', '/api/admin/reservas',
  ]) {
    assert.equal(isRetiredReservationPath(path), true, path);
  }

  for (const path of [
    '/api/formulario', '/api/interes', '/api/confirmar',
    '/api/v1/integrations/cucuru', '/api/v1/reforestacion/aportes/resumen',
  ]) {
    assert.equal(isRetiredReservationPath(path), false, path);
  }

  const response = retiredReservationResponse();
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).error.code, 'reservas_cutover');
});

test('static customer copy no longer claims obsolete stay prices', () => {
  const data = JSON.parse(read('data.json'));
  assert.equal(data.es.menu.bookLink, 'https://reservas.experienciamagico.com/reservar?paso=fechas');
  assert.equal(data.en.menu.bookLink, 'https://reservas.experienciamagico.com/reservar?paso=fechas');
  assert.doesNotMatch(data.es.hero.reservationPricing, /\$|Desde/);
  assert.doesNotMatch(data.en.hero.reservationPricing, /USD|From/);
});
