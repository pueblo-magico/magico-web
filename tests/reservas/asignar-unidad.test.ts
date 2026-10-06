import assert from 'node:assert/strict';
import test from 'node:test';

import { asignarUnidadReserva } from '../../functions/_application/reservas/asignarUnidadReserva.ts';
import type {
  RegistroAuditoriaReservas,
  RepositorioAsignacionesReserva,
} from '../../functions/_application/reservas/ports.ts';
import { D1RegistroAuditoriaReservas } from '../../functions/_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioAsignacionesReserva } from '../../functions/_infrastructure/d1/D1RepositorioAsignacionesReserva.ts';

test('asigna una unidad normalizada y registra la auditoría', async () => {
  const asignaciones: unknown[][] = [];
  const auditorias: unknown[][] = [];
  const repository: RepositorioAsignacionesReserva = {
    async asignarUnidad(...valores) {
      asignaciones.push(valores);
      return { id: 12, unidad_asignada: String(valores[1]) };
    },
  };
  const auditoria: RegistroAuditoriaReservas = {
    async registrar(...valores) {
      auditorias.push(valores);
    },
  };

  const resultado = await asignarUnidadReserva(
    { reservaId: 12, unidadAsignada: '  Domo 2  ', actorEmail: 'admin@magico.test' },
    repository,
    auditoria
  );

  assert.deepEqual(asignaciones, [[12, 'Domo 2']]);
  assert.deepEqual(auditorias, [[
    { email: 'admin@magico.test', accion: 'asignar_unidad', entidadTipo: 'reserva', entidadId: 12, metadata: { asignada: true } },
  ]]);
  assert.deepEqual(resultado, { ok: true, reservaId: 12, unidadAsignada: 'Domo 2' });
});

test('no audita cuando la reserva no existe', async () => {
  let auditada = false;
  const resultado = await asignarUnidadReserva(
    { reservaId: 99, unidadAsignada: '', actorEmail: 'admin@magico.test' },
    { async asignarUnidad() { return null; } },
    { async registrar() { auditada = true; } }
  );

  assert.deepEqual(resultado, { ok: false, codigo: 'RESERVA_NO_ENCONTRADA' });
  assert.equal(auditada, false);
});

test('los adaptadores D1 encapsulan asignación y auditoría', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) {
          call.values = values;
          return this;
        },
        async first() {
          return { id: '4', unidad_asignada: null };
        },
        async run() {
          return {};
        },
      };
    },
  };

  const asignacion = await new D1RepositorioAsignacionesReserva(db).asignarUnidad(4, '');
  await new D1RegistroAuditoriaReservas(db).registrar({ email: 'a@b.test', accion: 'asignar_unidad' });

  assert.deepEqual(asignacion, { id: 4, unidad_asignada: null });
  assert.deepEqual(calls[0].values, ['', 4]);
  assert.deepEqual(calls[1].values, ['a@b.test', 'asignar_unidad', null, null, null, null, null]);
});

test('el adaptador de asignación devuelve null si no hay reserva', async () => {
  const db = {
    prepare() {
      return {
        bind() { return this; },
        async first() { return null; },
      };
    },
  };

  assert.equal(await new D1RepositorioAsignacionesReserva(db).asignarUnidad(404, 'Domo'), null);
});
