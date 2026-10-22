import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { privateProposalShell, PRIVATE_PROPOSAL_PATH } from '../scripts/private-proposal.mjs';

test('proposal HTML excludes public SEO and has noindex without JavaScript', () => {
  const input = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const html = privateProposalShell(input);
  assert.match(html, /<title>Aula Verde · Propuesta para 360 Travel<\/title>/);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive, nosnippet"/);
  assert.match(html, /name="googlebot" content="noindex/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(html, /rel="canonical"|property="og:|name="description"|application\/ld\+json/);
  assert.match(html, /id="root"/);
  assert.match(html, /index\.tsx/);
});

test('server directives cover URL variants and proposal remains outside discovery', () => {
  const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/AulaVerdeTravel360.tsx', import.meta.url), 'utf8');
  assert.ok(headers.includes(`${PRIVATE_PROPOSAL_PATH}*\n  X-Robots-Tag: noindex`));
  assert.match(redirects, /\/aulas-verdes-travel-360\s+\/aulas-verdes-360-travel\s+301/);
  assert.match(page, /360 Travel/);
  assert.doesNotMatch(page, /Travel 360/);
  for (const file of ['public/sitemap.xml', 'components/Header.tsx', 'components/Footer.tsx']) {
    assert.ok(!readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').includes(PRIVATE_PROPOSAL_PATH));
  }
});
