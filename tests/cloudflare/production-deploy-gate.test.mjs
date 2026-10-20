import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/deploy.yml', import.meta.url),
  'utf8'
);

test('production deployment requires a manual dispatch and protected environment', () => {
  assert.match(workflow, /^\s{2}workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^\s{2}push:/m);
  assert.match(workflow, /^\s{4}environment:\s*\r?\n\s{6}name: production/m);
  assert.match(workflow, /^concurrency:/m);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('every production D1 command selects the production environment explicitly', () => {
  const d1Commands = workflow
    .split(/\r?\n/)
    .filter(line => line.includes('command: d1 '));

  assert.ok(d1Commands.length > 0);
  assert.ok(d1Commands.every(line => line.includes('--env production')));
});
