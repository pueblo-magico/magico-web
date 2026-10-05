import assert from 'node:assert/strict';
import test from 'node:test';

import { D1RepositorioDisponibilidad } from '../../functions/_infrastructure/d1/D1RepositorioDisponibilidad.ts';

function fakeDb(row: Record<string, unknown> | null) {
  const calls: { query: string; values: unknown[] }[] = [];

  return {
    calls,
    db: {
      prepare(query: string) {
        const call = { query, values: [] as unknown[] };
        calls.push(call);
        return {
          bind(...values: unknown[]) {
            call.values = values;
            return this;
          },
          async first() {
            return row;
          },
        };
      },
    },
  };
}

test('encuentra un domo libre usando el intervalo solicitado', async () => {
  const { db, calls } = fakeDb({ id: 4 });
  const repository = new D1RepositorioDisponibilidad(db);

  const resultado = await repository.consultar({
    tipo: 'domo',
    personas: 2,
    fechaEntrada: '2026-10-10',
    fechaSalida: '2026-10-12',
  });

  assert.deepEqual(resultado, { estado: 'disponible', alojamiento_id: 4 });
  assert.deepEqual(calls[0].values, ['2026-10-10', '2026-10-12']);
  assert.match(calls[0].query, /r\.fecha_checkin < \?2 AND r\.fecha_checkout > \?1/);
});

test('informa un domo ocupado cuando no hay unidad libre', async () => {
  const { db } = fakeDb(null);
  const repository = new D1RepositorioDisponibilidad(db);

  const resultado = await repository.consultar({
    tipo: 'domo',
    personas: 2,
    fechaEntrada: '2026-10-10',
    fechaSalida: '2026-10-12',
  });

  assert.deepEqual(resultado, { estado: 'ocupado', alojamiento_id: null });
});

test('calcula disponibilidad compartida del refugio', async () => {
  const { db } = fakeDb({ id: 1, capacidad_total: 15, ocupadas: 12 });
  const repository = new D1RepositorioDisponibilidad(db);

  const disponible = await repository.consultar({
    tipo: 'refugio',
    personas: 3,
    fechaEntrada: '2026-10-10',
    fechaSalida: '2026-10-12',
  });
  const ocupado = await repository.consultar({
    tipo: 'refugio',
    personas: 4,
    fechaEntrada: '2026-10-10',
    fechaSalida: '2026-10-12',
  });

  assert.deepEqual(disponible, { estado: 'disponible', alojamiento_id: 1 });
  assert.deepEqual(ocupado, { estado: 'ocupado', alojamiento_id: 1 });
});

test('mantiene el fallback legacy cuando falta la fila del refugio', async () => {
  const { db } = fakeDb(null);
  const repository = new D1RepositorioDisponibilidad(db);

  const resultado = await repository.consultar({
    tipo: 'refugio',
    personas: 15,
    fechaEntrada: '2026-10-10',
    fechaSalida: '2026-10-12',
  });

  assert.deepEqual(resultado, { estado: 'disponible', alojamiento_id: null });
});
