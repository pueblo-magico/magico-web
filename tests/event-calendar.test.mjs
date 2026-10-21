import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getEventCalendarDateKey,
  shouldShowMainCalendarEvent,
} from '../src/utils/eventCalendar.ts';

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

test('calendar day uses the event location timezone', () => {
  assert.equal(getEventCalendarDateKey(new Date('2026-10-21T02:30:00.000Z')), '2026-10-20');
  assert.equal(getEventCalendarDateKey(new Date('2026-10-21T03:30:00.000Z')), '2026-10-21');
});
