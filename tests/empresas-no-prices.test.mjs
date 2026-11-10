import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../data.json', import.meta.url), 'utf8'));
const component = await readFile(new URL('../src/components/EmpresasProceso.tsx', import.meta.url), 'utf8');

test('the Empresas page does not publish fixed prices in either language', () => {
  for (const language of ['es', 'en']) {
    const empresas = data[language].empresas;
    const costAnswer = empresas.faq.items.find((item) =>
      /cuánto cuesta|how much does it cost/i.test(item.q),
    );

    assert.ok(costAnswer);
    assert.ok(empresas.formatos.items.every((item) => !('price' in item)));
    assert.doesNotMatch(costAnswer.a, /\$|\b(?:ARS|USD)\b|\d[.,]\d{3}/i);
  }

  assert.doesNotMatch(component, /item\.price/);
});
