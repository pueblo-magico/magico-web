import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('group retreats card opens the retreat organizer landing', () => {
  const source = read('components/SectionNichos.tsx');
  const retreatCard = source.match(/tag:\s+t\.retreats\.tag[\s\S]*?external:\s*false,/);

  assert.ok(retreatCard, 'Retiros Grupales card should be an internal link');
  assert.match(retreatCard[0], /href:\s+ROUTES\.ORGANIZA_TU_RETIRO/);
});

test('Experiencias submenu exposes the retreat organizer in both languages', () => {
  const content = JSON.parse(read('data.json'));
  const expectedLabels = { es: 'Mi retiro', en: 'My retreat' };

  for (const [language, label] of Object.entries(expectedLabels)) {
    const experiences = content[language].menu.items.find(item => item.href === '#experiencias');
    assert.ok(experiences, `Experiencias menu is missing for ${language}`);
    assert.ok(
      experiences.submenu.some(item => item.label === label && item.href === '/organiza-tu-retiro'),
      `${label} should link to /organiza-tu-retiro`,
    );
  }
});
