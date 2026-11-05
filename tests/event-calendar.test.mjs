import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  getEventCalendarDateKey,
  shouldShowMainCalendarEvent,
  shouldShowUpcomingEvent,
} from '../src/utils/eventCalendar.ts';

const translations = JSON.parse(readFileSync(new URL('../data.json', import.meta.url), 'utf8'));

test('calendar hides events only after their final day', () => {
  const today = '2026-10-21';

  assert.equal(shouldShowMainCalendarEvent({ endDate: '2026-10-20' }, today), false);
  assert.equal(shouldShowMainCalendarEvent({ endDate: '2026-10-21' }, today), true);
  assert.equal(shouldShowMainCalendarEvent({ startDate: '2026-10-22' }, today), true);
});

test('calendar keeps recurring and always-available undated cards', () => {
  assert.equal(shouldShowMainCalendarEvent({}, '2026-10-21'), true);
  assert.equal(shouldShowMainCalendarEvent({ startDate: 'not-a-date' }, '2026-10-21'), true);
});

test('calendar still respects cards explicitly hidden from the main calendar', () => {
  assert.equal(
    shouldShowMainCalendarEvent({ showInMainEvents: false, endDate: '2026-12-31' }, '2026-10-21'),
    false,
  );
});

test('upcoming-event checks do not inherit homepage visibility', () => {
  const reforestationCall = {
    showInMainEvents: false,
    endDate: '2026-11-08',
  };

  assert.equal(shouldShowUpcomingEvent(reforestationCall, '2026-10-23'), true);
  assert.equal(shouldShowMainCalendarEvent(reforestationCall, '2026-10-23'), false);
});

test('calendar day uses the event location timezone', () => {
  assert.equal(getEventCalendarDateKey(new Date('2026-10-21T02:30:00.000Z')), '2026-10-20');
  assert.equal(getEventCalendarDateKey(new Date('2026-10-21T03:30:00.000Z')), '2026-10-21');
});

test('upcoming reforestation weekends stay visible and link to volunteering', () => {
  for (const language of ['es', 'en']) {
    const cards = translations[language].events.cards.filter((card) => card.isReforestacion);

    assert.equal(cards.length, 2);
    for (const card of cards) {
      assert.equal(card.showInMainEvents, true);
      assert.equal(card.link, '/reforestacion#voluntariado');
      assert.equal(shouldShowMainCalendarEvent(card, '2026-11-04'), true);
    }
  }
});

test('Achala Viva stays routable but is hidden from the main calendar', () => {
  for (const language of ['es', 'en']) {
    const card = translations[language].events.cards.find((event) => event.title === 'Achala Viva');

    assert.ok(card);
    assert.equal(card.link, '/achala-viva');
    assert.equal(card.showInMainEvents, false);
    assert.equal(shouldShowMainCalendarEvent(card, '2026-11-04'), false);
  }
});

test('Reset Vital and Fly Fishing keep their destinations but stay out of the agenda', () => {
  const expectedDestinations = new Map([
    ['Reset Vital', '/estadia'],
    ['Córdoba Fly Fishing Adventure', '/cordoba-fly-fishing'],
  ]);

  for (const language of ['es', 'en']) {
    for (const [title, destination] of expectedDestinations) {
      const card = translations[language].events.cards.find((event) => event.title === title);

      assert.ok(card);
      assert.equal(card.link, destination);
      assert.equal(card.showInMainEvents, false);
      assert.equal(shouldShowMainCalendarEvent(card, '2026-11-04'), false);
    }
  }
});

test('the December peyote ceremony is dated and opens its WhatsApp contact', () => {
  const expectedTitles = {
    es: 'Ceremonia tradicional de peyote',
    en: 'Traditional peyote ceremony',
  };

  for (const language of ['es', 'en']) {
    const card = translations[language].events.cards.find((event) => event.title === expectedTitles[language]);

    assert.ok(card);
    assert.equal(card.startDate, '2026-12-03');
    assert.equal(card.endDate, '2026-12-03');
    assert.equal(card.image, '/uploads/sunset-rio-fogon-real.webp');
    assert.equal(card.statusLabel, language === 'es' ? 'CUPOS LIMITADOS' : 'LIMITED PLACES');
    assert.equal(card.labels.length, 2);
    assert.match(card.link, /^https:\/\/wa\.me\/529843234048\?text=/);
    assert.equal(shouldShowMainCalendarEvent(card, '2026-11-04'), true);
  }
});

test('El Despertar del Colibrí uses the official artwork and limited-place messaging', () => {
  for (const language of ['es', 'en']) {
    const card = translations[language].events.cards.find((event) => event.title === 'El Despertar del Colibrí');

    assert.ok(card);
    assert.equal(card.statusLabel, language === 'es' ? 'CUPOS LIMITADOS' : 'LIMITED PLACES');
    assert.equal(card.image, '/uploads/events/el-despertar-del-colibri-oficial.png');
    assert.equal(card.imageFit, 'contain');
    assert.match(card.desc, /Acan de Fuego/);
    assert.equal(card.link, '/el-despertar-del-colibri');
  }
});

test('every visible upcoming event has a status and two thematic labels', () => {
  for (const language of ['es', 'en']) {
    const cards = translations[language].events.cards.filter((card) => (
      shouldShowMainCalendarEvent(card, '2026-11-04')
    ));

    assert.ok(cards.length > 0);
    for (const card of cards) {
      assert.ok(card.statusLabel, `${language}: ${card.title} is missing a status label`);
      assert.equal(card.labels?.length, 2, `${language}: ${card.title} needs exactly two thematic labels`);
    }
  }
});
