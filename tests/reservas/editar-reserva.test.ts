import assert from 'node:assert/strict';
import test from 'node:test';

import { editarReserva } from '../../functions/_application/reservas/editarReserva.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioEdicionReserva,
} from '../../functions/_application/reservas/ports.ts';
import { D1RepositorioEdicionReserva } from '../../functions/_infrastructure/d1/D1RepositorioEdicionReserva.ts';

test('edita parcialmente una reserva y audita los cambios', async () => {
  const actualizaciones: unknown[][] = [];
  const auditorias: unknown[][] = [];
  const repository: RepositorioEdicionReserva = {
    async actualizarParcial(...valores) {
      actualizaciones.push(valores);
      return { id: 7 };
    },
  };
  const auditoria: RegistroAuditoriaReservas = {
    async registrar(...valores) { auditorias.push(valores); },
  };

  const resultado = await editarReserva(
    {
      reservaId: 7,
      cambios: { cliente_nombre: 'Ana', monto_sena: 20_000 },
      actorEmail: 'admin@magico.test',
    },
    repository,
    auditoria
  );

  assert.deepEqual(actualizaciones, [[7, { cliente_nombre: 'Ana', monto_sena: 20_000 }]]);
  assert.deepEqual(auditorias, [[
    'admin@magico.test',
    'editar_reserva',
    'Reserva #7: cliente_nombre=Ana, monto_sena=20000',
  ]]);
  assert.deepEqual(resultado, { ok: true, reservaId: 7 });
});

test('distingue la cancelación en la auditoría', async () => {
  const auditorias: unknown[][] = [];
  await editarReserva(
    { reservaId: 8, cambios: { estado: 'cancelada' }, actorEmail: 'admin@magico.test' },
    { async actualizarParcial() { return { id: 8 }; } },
    { async registrar(...valores) { auditorias.push(valores); } }
  );

  assert.equal(auditorias[0][1], 'cancelar_reserva');
});

test('no audita si la reserva no existe', async () => {
  let auditada = false;
  const resultado = await editarReserva(
    { reservaId: 404, cambios: { estado: 'confirmada' }, actorEmail: 'admin@magico.test' },
    { async actualizarParcial() { return null; } },
    { async registrar() { auditada = true; } }
  );

  assert.deepEqual(resultado, { ok: false, codigo: 'RESERVA_NO_ENCONTRADA' });
  assert.equal(auditada, false);
});

test('el adaptador D1 genera un update parametrizado sólo con columnas permitidas', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) { call.values = values; return this; },
        async first() { return { id: '9' }; },
      };
    },
  };
  const repository = new D1RepositorioEdicionReserva(db);

  assert.deepEqual(
    await repository.actualizarParcial(9, { cliente_email: 'ana@example.com', monto_total: 100_000 }),
    { id: 9 }
  );
  assert.match(calls[0].query, /SET cliente_email = \?, monto_total = \?/);
  assert.deepEqual(calls[0].values, ['ana@example.com', 100_000, 9]);
});

test('el adaptador D1 rechaza updates vacíos o columnas no permitidas', async () => {
  const db = { prepare() { throw new Error('no debe consultar D1'); } };
  const repository = new D1RepositorioEdicionReserva(db as never);

  await assert.rejects(repository.actualizarParcial(1, {}), /Campos de edición inválidos/);
  await assert.rejects(
    repository.actualizarParcial(1, { ['estado = \'cancelada\' WHERE 1=1 --' as never]: true }),
    /Campos de edición inválidos/
  );
});

test('el adaptador D1 devuelve null cuando la reserva no existe', async () => {
  const db = {
    prepare() {
      return {
        bind() { return this; },
        async first() { return null; },
      };
    },
  };

  assert.equal(
    await new D1RepositorioEdicionReserva(db).actualizarParcial(404, { estado: 'confirmada' }),
    null
  );
});
