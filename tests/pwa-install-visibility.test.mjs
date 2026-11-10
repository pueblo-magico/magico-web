import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the global PWA install banner is limited to Reset Vital', () => {
  const index = read('index.tsx');

  assert.match(index, /const ResetVitalInstallBanner/);
  assert.match(index, /pathname === ['"]\/reset-vital['"]\s*\?\s*<PWAInstallBanner\s*\/>\s*:\s*null/);
  assert.match(index, /<ResetVitalInstallBanner\s*\/>/);
  assert.doesNotMatch(index, /<UpdateBanner\s*\/>\s*\r?\n\s*<PWAInstallBanner\s*\/>/);
});
