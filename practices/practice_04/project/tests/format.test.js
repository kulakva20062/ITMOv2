import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice } from '../src/format.js';

test('formatPrice разделяет разряды и добавляет знак рубля', () => {
  assert.equal(formatPrice(12500), '12 500 ₽');
});

test('formatPrice округляет копейки', () => {
  assert.equal(formatPrice(999.6), '1 000 ₽');
});
