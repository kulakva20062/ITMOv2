import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../src/format.js';

test('formatDate переводит ISO-дату в ДД.ММ.ГГГГ', () => {
  assert.equal(formatDate('2026-11-10'), '10.11.2026');
});

test('formatDate сохраняет ведущие нули дня и месяца', () => {
  assert.equal(formatDate('2026-01-05'), '05.01.2026');
});

test('formatDate требует строку строго вида ГГГГ-ММ-ДД', () => {
  assert.throws(() => formatDate('10.11.2026'), RangeError);
  assert.throws(() => formatDate('2026-1-5'), RangeError);
  assert.throws(() => formatDate('2026-11-10T00:00:00Z'), RangeError);
  assert.throws(() => formatDate(undefined), RangeError);
  assert.throws(() => formatDate(null), RangeError);
});
