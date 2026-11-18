import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePortalUrl, resolvePortalUrl } from '../src/data/portalUrl.ts';

test('normalizes trusted portal destinations without carrying URL state', () => {
  assert.equal(
    normalizePortalUrl(' https://mi.experienciamagico.com/ '),
    'https://mi.experienciamagico.com',
  );
  assert.equal(
    normalizePortalUrl('https://example.com/acceso/'),
    'https://example.com/acceso',
  );
  assert.equal(normalizePortalUrl('http://localhost:8080/'), 'http://localhost:8080');
});

test('rejects unsafe portal destinations and falls back to the canonical URL', () => {
  const fallback = 'https://mi.experienciamagico.com';

  assert.equal(normalizePortalUrl('javascript:alert(1)'), null);
  assert.equal(normalizePortalUrl('http://example.com'), null);
  assert.equal(normalizePortalUrl('https://user:secret@example.com'), null);
  assert.equal(normalizePortalUrl('https://example.com/?token=secret'), null);
  assert.equal(normalizePortalUrl('https://example.com/#session'), null);
  assert.equal(resolvePortalUrl('not a URL', fallback), fallback);
});
