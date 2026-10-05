import assert from 'node:assert/strict';
import test from 'node:test';

import { cotizarEstadia } from '../../functions/_application/reservas/cotizarEstadia.ts';
import type { RepositorioDisponibilidad } from '../../functions/_application/reservas/ports.ts';
import { nochesEntre } from '../../functions/_domain/reservas/dateRange.ts';
import { calcularPrecio, calcularSena, mensajePrivacidad } from '../../functions/_domain/reservas/pricing.ts';

const disponible: RepositorioDisponibilidad = {
  async consultar() {
    return { estado: 'disponible', alojamiento_id: 7 };
  },
};

function precioPorNoche(tipo: 'domo' | 'refugio', personas: number): number {
  const resultado = calcularPrecio(tipo, personas, 1);
  assert.ok(!('error' in resultado));
  return resultado.precio_por_noche;
}

test('calcula noches con checkout exclusivo', () => {
  assert.equal(nochesEntre('2026-10-10', '2026-10-11'), 1);
  assert.equal(nochesEntre('2026-10-10', '2026-10-13'), 3);
  assert.equal(nochesEntre('2026-10-10', '2026-10-10'), null);
  assert.equal(nochesEntre('fecha-invalida', '2026-10-11'), null);
});

test('preserva las reglas de precio legacy durante la migración', () => {
  assert.deepEqual(calcularPrecio('domo', 2, 3), {
    tipo_alojamiento: 'domo',
    cantidad_personas: 2,
    noches: 3,
    precio_por_noche: 75_000,
    subtotal: 225_000,
    exclusividad_gratis: false,
  });
  assert.deepEqual(calcularSena(100_000), { porcentaje: 0.5, monto: 50_000 });
  assert.deepEqual(calcularSena(100_001), { porcentaje: 0.3, monto: 30_000 });
});

test('cubre las bandas de precio legacy y los límites del refugio', () => {
  assert.equal(precioPorNoche('domo', 1), 150_000);
  assert.equal(precioPorNoche('domo', 3), 195_000);
  assert.equal(precioPorNoche('domo', 6), 300_000);
  assert.equal(precioPorNoche('refugio', 2), 70_000);
  assert.deepEqual(calcularPrecio('refugio', 16, 1), {
    error: 'El Refugio Compartido admite entre 1 y 15 personas.',
  });
});

test('mantiene la capacidad pública de domos en siete', () => {
  assert.ok(!('error' in calcularPrecio('domo', 7, 1)));
  assert.deepEqual(calcularPrecio('domo', 8, 1), { error: 'El Domo admite entre 1 y 7 personas.' });
});

test('expone el mensaje legacy de privacidad del refugio', () => {
  assert.notEqual(mensajePrivacidad('refugio', 4), '');
  assert.equal(mensajePrivacidad('refugio', 5), '');
});

test('cotiza a través de un puerto sin depender de D1 o Workers', async () => {
  const resultado = await cotizarEstadia(
    { tipo: 'refugio', personas: 2, fechaEntrada: '2026-10-10', fechaSalida: '2026-10-12' },
    disponible
  );

  assert.equal(resultado.ok, true);
  if (!resultado.ok) return;
  assert.equal(resultado.valor.disponibilidad.alojamiento_id, 7);
  assert.equal(resultado.valor.desglose.subtotal, 140_000);
  assert.deepEqual(resultado.valor.sena, { porcentaje: 0.3, monto: 42_000 });
  assert.equal(resultado.valor.saldoCheckin, 98_000);
});

test('rechaza fechas inválidas antes de consultar disponibilidad', async () => {
  const noDebeConsultarse: RepositorioDisponibilidad = {
    async consultar() {
      throw new Error('El repositorio no debe ejecutarse para una solicitud inválida.');
    },
  };

  const resultado = await cotizarEstadia(
    { tipo: 'domo', personas: 2, fechaEntrada: '2026-10-12', fechaSalida: '2026-10-10' },
    noDebeConsultarse
  );

  assert.deepEqual(resultado, {
    ok: false,
    error: {
      codigo: 'FECHAS_INVALIDAS',
      mensaje: 'Fechas inválidas: fecha_salida debe ser posterior a fecha_entrada.',
    },
  });
});

test('rechaza ocupación inválida antes de consultar disponibilidad', async () => {
  const noDebeConsultarse: RepositorioDisponibilidad = {
    async consultar() {
      throw new Error('El repositorio no debe ejecutarse para una solicitud inválida.');
    },
  };

  const resultado = await cotizarEstadia(
    { tipo: 'domo', personas: 8, fechaEntrada: '2026-10-10', fechaSalida: '2026-10-12' },
    noDebeConsultarse
  );

  assert.deepEqual(resultado, {
    ok: false,
    error: {
      codigo: 'OCUPACION_INVALIDA',
      mensaje: 'El Domo admite entre 1 y 7 personas.',
    },
  });
});
