import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function configureDevD1Config(source, databaseId) {
  if (!UUID_PATTERN.test(databaseId ?? '')) {
    throw new Error('MAGICO_WEB_DEV_D1_DATABASE_ID must be a valid D1 database UUID.');
  }

  const withName = source.replace(
    /database_name\s*=\s*"magico-ensueno-db"/,
    'database_name = "magico-web-dev"'
  );
  const configured = withName.replace(
    /database_id\s*=\s*"[0-9a-f-]+"/i,
    `database_id = "${databaseId}"`
  );

  if (configured === source || !configured.includes(`database_id = "${databaseId}"`)) {
    throw new Error('Could not replace the production D1 binding in wrangler.toml.');
  }

  return configured;
}

async function main() {
  const configPath = 'wrangler.toml';
  const source = await readFile(configPath, 'utf8');
  const configured = configureDevD1Config(
    source,
    process.env.MAGICO_WEB_DEV_D1_DATABASE_ID
  );
  await writeFile(configPath, configured);
  console.log('Configured wrangler.toml for the isolated magico-web-dev D1 database.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
