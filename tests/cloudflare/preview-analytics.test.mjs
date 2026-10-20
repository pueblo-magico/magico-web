import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const clarityStart = html.indexOf('(function() {', html.indexOf('// Microsoft Clarity'));
const clarityEnd = html.indexOf('// Service Worker PWA');
const claritySource = html.slice(clarityStart, clarityEnd);

function ejecutarClarity(hostname) {
  const listeners = [];
  const timers = [];
  const window = {
    addEventListener(evento) { listeners.push(evento); },
  };
  const context = {
    location: { hostname },
    localStorage: { getItem() { return null; } },
    document: {},
    window,
    setTimeout(callback, delay) { timers.push({ callback, delay }); },
  };
  vm.runInNewContext(claritySource, context);
  return { window, listeners, timers };
}

test('Clarity no crea cola, listeners ni timer en aliases o URLs inmutables de preview', () => {
  for (const hostname of [
    'pr-45.pueblo-magico-web.pages.dev',
    '87bba45.pueblo-magico-web.pages.dev',
  ]) {
    const resultado = ejecutarClarity(hostname);
    assert.equal(resultado.window.clarity, undefined);
    assert.deepEqual(resultado.listeners, []);
    assert.deepEqual(resultado.timers, []);
  }
});

test('Clarity sigue habilitado en producción y deshabilitado en desarrollo local', () => {
  for (const hostname of ['experienciamagico.com', 'pueblo-magico-web.pages.dev']) {
    const resultado = ejecutarClarity(hostname);
    assert.equal(typeof resultado.window.clarity, 'function');
    assert.deepEqual(resultado.listeners, ['click', 'keydown', 'touchstart', 'scroll', 'mousemove']);
    assert.equal(resultado.timers.length, 1);
    assert.equal(resultado.timers[0].delay, 8000);
  }

  for (const hostname of ['localhost', '127.0.0.1']) {
    const resultado = ejecutarClarity(hostname);
    assert.equal(resultado.window.clarity, undefined);
    assert.deepEqual(resultado.listeners, []);
    assert.deepEqual(resultado.timers, []);
  }
});
