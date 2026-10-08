import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const terms = readFileSync(new URL('../../src/TerminosYCondiciones.tsx', import.meta.url), 'utf8');
const privacy = readFileSync(new URL('../../src/PoliticaPrivacidad.tsx', import.meta.url), 'utf8');
const booking = readFileSync(new URL('../../components/BookingWidget.tsx', import.meta.url), 'utf8');

test('los términos describen el flujo online sin promesas comerciales inventadas', () => {
  assert.match(terms, /pendiente de pago/);
  assert.match(terms, /no acredita el pago ni la confirmación/);
  assert.match(terms, /duración exacta es configurable/);
  assert.match(terms, /pago tardío|transferencia realizada después del vencimiento/i);
  assert.match(terms, /pendiente de configuración/);
  assert.doesNotMatch(terms, /carácter informativo/);
  assert.doesNotMatch(terms, /se retiene el (50|100)%/);
});

test('los documentos legales ofrecen contenido ES y EN y usan la norma vigente', () => {
  assert.match(terms, /Disposición 954\/2025/);
  assert.doesNotMatch(terms, /Resolución 424\/2020/);
  assert.match(terms, /Terms and Conditions/);
  assert.match(privacy, /Privacy Policy/);
  assert.match(terms, /toggleLanguage/);
  assert.match(privacy, /toggleLanguage/);
});

test('privacidad diferencia los plazos legales y evita inventar retención', () => {
  assert.match(privacy, /diez días corridos/);
  assert.match(privacy, /cinco días hábiles/);
  assert.match(privacy, /deben configurarse y aprobarse/);
  assert.doesNotMatch(privacy, /en general, 5 años/);
});

test('los enlaces legales usan las rutas canónicas de Cloudflare Pages', () => {
  assert.match(terms, /href="\/politica-de-privacidad\/"/);
  assert.match(privacy, /href="\/terminos-y-condiciones\/"/);
  assert.match(booking, /href="\/terminos-y-condiciones\/"/);
  assert.match(booking, /href="\/politica-de-privacidad\/"/);
});
