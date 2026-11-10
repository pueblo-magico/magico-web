import assert from 'node:assert/strict';
import test from 'node:test';

import { configureDevD1Config } from '../../scripts/cloudflare/configure-dev-d1.mjs';

const productionConfig = `[[d1_databases]]
binding = "DB"
database_name = "magico-ensueno-db"
database_id = "4431f6d6-052c-4f35-8fd7-4805b2d7a858"
`;

test('replaces the production D1 binding with the isolated DEV database', () => {
  const configured = configureDevD1Config(
    productionConfig,
    'c9a07e19-1586-42a9-94b9-364d7765f359'
  );

  assert.match(configured, /database_name = "magico-web-dev"/);
  assert.match(configured, /database_id = "c9a07e19-1586-42a9-94b9-364d7765f359"/);
  assert.doesNotMatch(configured, /4431f6d6-052c-4f35-8fd7-4805b2d7a858/);
});

test('rejects a missing or invalid DEV database ID', () => {
  assert.throws(() => configureDevD1Config(productionConfig, ''), /valid D1 database UUID/);
  assert.throws(() => configureDevD1Config(productionConfig, 'production'), /valid D1 database UUID/);
});
