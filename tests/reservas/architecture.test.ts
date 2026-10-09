import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const domainDir = path.resolve('functions/_domain/reservas');

test('el dominio no depende de infraestructura, interfaces o aplicación', async () => {
  const files = (await readdir(domainDir)).filter((file) => file.endsWith('.ts'));
  const forbidden = [/_infrastructure/, /_interfaces/, /_application/, /\bfetch\s*\(/, /\.prepare\s*\(/];

  for (const file of files) {
    const source = await readFile(path.join(domainDir, file), 'utf8');
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file} viola el límite de dominio: ${pattern}`);
    }
  }
});
