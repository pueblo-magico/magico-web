import assert from 'node:assert/strict';
import test from 'node:test';

import { consultarCalendarioDisponibilidad } from '../../functions/_application/reservas/consultarCalendarioDisponibilidad.ts';
import type { RepositorioCalendarioDisponibilidad } from '../../functions/_application/reservas/ports.ts';
import { construirCalendarioDisponibilidad } from '../../functions/_domain/reservas/availabilityCalendar.ts';

const alojamientos = [
  { id: 1, nombre: 'Refugio', tipo: 'refugio' as const, capacidad_total: 15 },
  { id: 2, nombre: 'Domo 1', tipo: 'domo' as const, capacidad_total: 7 },
  { id: 3, nombre: 'Domo 2', tipo: 'domo' as const, capacidad_total: 7 },
];

test('construye bloqueos por noche sin contar el checkout', () => {
  const resultado = construirCalendarioDisponibilidad('2026-10-10', '2026-10-13', alojamientos, [
    { alojamiento_id: 2, fecha_checkin: '2026-10-10', fecha_checkout: '2026-10-12', cantidad_personas: 2 },
    { alojamiento_id: 3, fecha_checkin: '2026-10-11', fecha_checkout: '2026-10-12', cantidad_personas: 2 },
    { alojamiento_id: 1, fecha_checkin: '2026-10-10', fecha_checkout: '2026-10-11', cantidad_personas: 15 },
  ]);

  assert.deepEqual(resultado.domo.blocked, ['2026-10-11']);
  assert.deepEqual(resultado.refugio.blocked, ['2026-10-10']);
  assert.deepEqual(resultado.unidades.find((unidad) => unidad.id === 2)?.blocked, [
    '2026-10-10',
    '2026-10-11',
  ]);
  assert.deepEqual(resultado.unidades.find((unidad) => unidad.id === 3)?.blocked, ['2026-10-11']);
});

test('ignora reservas cuyo alojamiento ya no existe', () => {
  const resultado = construirCalendarioDisponibilidad('2026-10-10', '2026-10-11', alojamientos, [
    { alojamiento_id: 99, fecha_checkin: '2026-10-10', fecha_checkout: '2026-10-11', cantidad_personas: 20 },
  ]);

  assert.deepEqual(resultado.domo.blocked, []);
  assert.deepEqual(resultado.refugio.blocked, []);
});

test('rechaza un rango inválido antes de consultar D1', async () => {
  const repository: RepositorioCalendarioDisponibilidad = {
    async listarAlojamientos() {
      throw new Error('No debe consultar alojamientos.');
    },
    async listarReservasActivas() {
      throw new Error('No debe consultar reservas.');
    },
  };

  const resultado = await consultarCalendarioDisponibilidad('2026-10-12', '2026-10-10', repository);
  assert.equal(resultado.ok, false);
});

test('consulta datos en paralelo y devuelve la proyección', async () => {
  const calls: string[] = [];
  const repository: RepositorioCalendarioDisponibilidad = {
    async listarAlojamientos() {
      calls.push('alojamientos');
      return alojamientos;
    },
    async listarReservasActivas(desde, hasta) {
      calls.push(`${desde}:${hasta}`);
      return [];
    },
  };

  const resultado = await consultarCalendarioDisponibilidad('2026-10-10', '2026-10-12', repository);
  assert.equal(resultado.ok, true);
  assert.deepEqual(calls.sort(), ['2026-10-10:2026-10-12', 'alojamientos']);
});
