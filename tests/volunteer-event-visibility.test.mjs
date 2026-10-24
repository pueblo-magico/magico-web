import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8'));
const pageSource = await readFile(new URL('../src/Voluntariado.tsx', import.meta.url), 'utf8');

test('Raíz Sonora is open for four volunteers for the complete weekend', () => {
  const spanishEvent = data.es.events.cards.find((event) => event.title.startsWith('Raíz Sonora'));

  assert.equal(spanishEvent.startDate, '2026-10-30');
  assert.equal(spanishEvent.endDate, '2026-11-01');
  assert.equal(spanishEvent.isVolunariado, true);
  assert.match(spanishEvent.desc, /4 voluntarios\/as/);
  assert.match(spanishEvent.desc, /niñas y niños/);
  assert.match(spanishEvent.desc, /cocina/);
  assert.match(spanishEvent.desc, /alojamiento y comidas/);
});

test('volunteer calendar hides events after their final date', () => {
  assert.match(pageSource, /isVolunariado === true && shouldShowMainCalendarEvent\(event\)/);
});
