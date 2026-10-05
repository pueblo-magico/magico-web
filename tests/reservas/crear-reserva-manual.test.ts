import assert from 'node:assert/strict';
import test from 'node:test';

import { crearReservaManual } from '../../functions/_application/reservas/crearReservaManual.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioCreacionReserva,
  ReservaManualNueva,
} from '../../functions/_application/reservas/ports.ts';
import { D1RepositorioCreacionReserva } from '../../functions/_infrastructure/d1/D1RepositorioCreacionReserva.ts';

const reserva: ReservaManualNueva = {
  clienteNombre: 'Ana',
  clienteTelefono: null,
  clienteEmail: null,
  alojamientoId: 2,
  fechaCheckin: '2026-10-10',
  fechaCheckout: '2026-10-12',
  cantidadPersonas: 2,
  montoTotal: 120_000,
  montoSena: 30_000,
  estado: 'confirmada',
  canalOrigen: 'Manual',
  tipoEstadia: 'huesped',
};

test('crea una reserva disponible y registra auditoría', async () => {
  const auditadas: unknown[][] = [];
  const repository: RepositorioCreacionReserva = {
    async contarSolapamientos() { return 0; },
    async crearManual(recibida) {
      assert.deepEqual(recibida, reserva);
      return { id: 22 };
    },
  };
  const auditoria: RegistroAuditoriaReservas = {
    async registrar(...valores) { auditadas.push(valores); },
  };

  const resultado = await crearReservaManual(
    { ...reserva, actorEmail: 'admin@magico.test' },
    repository,
    auditoria
  );

  assert.deepEqual(resultado, { reservaId: 22, disponible: true });
  assert.deepEqual(auditadas, [[
    'admin@magico.test',
    'crear_reserva',
    'Reserva #22 — Ana',
  ]]);
});

test('crea igualmente cuando el solapamiento es informativo', async () => {
  let creada = false;
  const resultado = await crearReservaManual(
    { ...reserva, actorEmail: 'admin@magico.test' },
    {
      async contarSolapamientos() { return 1; },
      async crearManual() { creada = true; return { id: 23 }; },
    },
    { async registrar() {} }
  );

  assert.equal(creada, true);
  assert.deepEqual(resultado, { reservaId: 23, disponible: false });
});

test('el adaptador D1 conserva intervalo, campos y orden de bindings', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const responses = [{ n: '2' }, { id: '31' }];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      const response = responses.shift() || null;
      return {
        bind(...values: unknown[]) {
          call.values = values;
          return this;
        },
        async first() { return response; },
      };
    },
  };
  const repository = new D1RepositorioCreacionReserva(db);

  assert.equal(await repository.contarSolapamientos(2, '2026-10-10', '2026-10-12'), 2);
  assert.deepEqual(await repository.crearManual(reserva), { id: 31 });
  assert.deepEqual(calls[0].values, [2, '2026-10-12', '2026-10-10']);
  assert.deepEqual(calls[1].values, [
    'Ana', null, null, 2, '2026-10-10', '2026-10-12', 2,
    120_000, 30_000, 'confirmada', 'Manual', 'huesped',
  ]);
});

test('el adaptador D1 aplica fallbacks si D1 no devuelve fila', async () => {
  const db = {
    prepare() {
      return {
        bind() { return this; },
        async first() { return null; },
      };
    },
  };
  const repository = new D1RepositorioCreacionReserva(db);

  assert.equal(await repository.contarSolapamientos(2, '2026-10-10', '2026-10-12'), 0);
  assert.deepEqual(await repository.crearManual(reserva), { id: undefined });
});
