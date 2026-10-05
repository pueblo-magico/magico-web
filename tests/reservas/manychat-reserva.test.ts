import assert from 'node:assert/strict';
import test from 'node:test';

import { iniciarReservaManyChat } from '../../functions/_application/reservas/iniciarReservaManyChat.ts';
import type {
  ProveedorCheckoutReserva,
  RepositorioDisponibilidad,
  RepositorioReservasManyChat,
  ReservaPendienteManyChat,
} from '../../functions/_application/reservas/ports.ts';
import { D1RepositorioReservasManyChat } from '../../functions/_infrastructure/d1/D1RepositorioReservasManyChat.ts';
import { MercadoPagoCheckoutReservas } from '../../functions/_infrastructure/mercadopago/MercadoPagoCheckoutReservas.ts';

const solicitud = {
  tipo: 'domo' as const,
  personas: 2,
  fechaEntrada: '2026-10-10',
  fechaSalida: '2026-10-12',
  userId: 'mc-123',
};

function disponibilidad(alojamientoId: number | null): RepositorioDisponibilidad {
  return {
    async consultar() {
      return {
        estado: alojamientoId === null ? 'ocupado' as const : 'disponible' as const,
        alojamiento_id: alojamientoId,
      };
    },
  };
}

test('inicia una reserva ManyChat y persiste la preferencia de pago', async () => {
  const creadas: ReservaPendienteManyChat[] = [];
  const preferencias: unknown[][] = [];
  const reservas: RepositorioReservasManyChat = {
    async crearPendiente(reserva) { creadas.push(reserva); return { id: 44 }; },
    async guardarPreferenciaPago(...valores) { preferencias.push(valores); },
  };
  const checkout: ProveedorCheckoutReserva = {
    async crearPreferencia() {
      return { preferenciaId: 'pref-44', checkoutUrl: 'https://pago.test/44' };
    },
  };

  const resultado = await iniciarReservaManyChat(
    solicitud,
    disponibilidad(3),
    reservas,
    checkout
  );

  assert.equal(resultado.estado, 'pendiente_pago');
  assert.equal(creadas[0]?.clienteNombre, 'ManyChat #mc-123');
  assert.deepEqual(preferencias, [[44, 'pref-44']]);
  if (resultado.estado === 'pendiente_pago') {
    assert.equal(resultado.reservaId, 44);
    assert.equal(resultado.checkoutUrl, 'https://pago.test/44');
  }
});

test('devuelve validación u ocupado sin crear una reserva', async () => {
  let creadas = 0;
  const reservas: RepositorioReservasManyChat = {
    async crearPendiente() { creadas += 1; return { id: 1 }; },
    async guardarPreferenciaPago() {},
  };
  const checkout: ProveedorCheckoutReserva = {
    async crearPreferencia() { throw new Error('no debe ejecutarse'); },
  };

  const invalida = await iniciarReservaManyChat(
    { ...solicitud, fechaSalida: solicitud.fechaEntrada },
    disponibilidad(3),
    reservas,
    checkout
  );
  const ocupada = await iniciarReservaManyChat(solicitud, disponibilidad(null), reservas, checkout);

  assert.equal(invalida.estado, 'error_validacion');
  assert.deepEqual(ocupada, { estado: 'ocupado' });
  assert.equal(creadas, 0);
});

test('distingue fallas de creación y de pago conservando la reserva pendiente', async () => {
  const sinId = await iniciarReservaManyChat(
    solicitud,
    disponibilidad(3),
    {
      async crearPendiente() { return { id: undefined }; },
      async guardarPreferenciaPago() {},
    },
    { async crearPreferencia() { throw new Error('no debe ejecutarse'); } }
  );
  const pagoFallido = await iniciarReservaManyChat(
    solicitud,
    disponibilidad(3),
    {
      async crearPendiente() { return { id: 55 }; },
      async guardarPreferenciaPago() {},
    },
    { async crearPreferencia() { throw new Error('secreto del proveedor'); } }
  );

  assert.deepEqual(sinId, { estado: 'error_creacion' });
  assert.deepEqual(pagoFallido, { estado: 'error_pago', reservaId: 55 });
});

test('también trata como error de pago una preferencia que no puede persistirse', async () => {
  const resultado = await iniciarReservaManyChat(
    solicitud,
    disponibilidad(3),
    {
      async crearPendiente() { return { id: 56 }; },
      async guardarPreferenciaPago() { throw new Error('D1 temporalmente no disponible'); },
    },
    {
      async crearPreferencia() {
        return { preferenciaId: 'pref-56', checkoutUrl: null };
      },
    }
  );

  assert.deepEqual(resultado, { estado: 'error_pago', reservaId: 56 });
});

test('el repositorio D1 encapsula creación pendiente y referencia de pago', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) { call.values = values; return this; },
        async first() { return { id: '61' }; },
        async run() { return {}; },
      };
    },
  };
  const repository = new D1RepositorioReservasManyChat(db);

  const creada = await repository.crearPendiente({
    clienteNombre: 'ManyChat #mc-123',
    alojamientoId: 3,
    fechaCheckin: '2026-10-10',
    fechaCheckout: '2026-10-12',
    cantidadPersonas: 2,
    montoTotal: 200_000,
    montoSena: 100_000,
    manyChatUserId: 'mc-123',
  });
  await repository.guardarPreferenciaPago(61, 'pref-61');

  assert.deepEqual(creada, { id: 61 });
  assert.deepEqual(calls[0].values, [
    'ManyChat #mc-123', 3, '2026-10-10', '2026-10-12', 2, 200_000, 100_000, 'mc-123',
  ]);
  assert.deepEqual(calls[1].values, ['pref-61', 61]);
});

test('el repositorio D1 conserva undefined si la inserción no devuelve fila', async () => {
  const db = {
    prepare() {
      return {
        bind() { return this; },
        async first() { return null; },
        async run() { return {}; },
      };
    },
  };
  const repository = new D1RepositorioReservasManyChat(db);

  assert.deepEqual(await repository.crearPendiente({
    clienteNombre: 'ManyChat #x', alojamientoId: 1,
    fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-11',
    cantidadPersonas: 1, montoTotal: 1, montoSena: 1, manyChatUserId: 'x',
  }), { id: undefined });
});

test('el adaptador de Mercado Pago construye una preferencia sin filtrar el token', async () => {
  let requestInit: RequestInit | undefined;
  const adapter = new MercadoPagoCheckoutReservas(
    'token-secreto',
    'https://magico.test',
    async (_url, init) => {
      requestInit = init;
      return new Response(JSON.stringify({ id: 88, init_point: 'https://pago.test/88' }), { status: 201 });
    }
  );

  const resultado = await adapter.crearPreferencia({
    reservaId: 88,
    tipoAlojamiento: 'domo',
    montoSena: 80_000,
  });
  const payload = JSON.parse(String(requestInit?.body));

  assert.deepEqual(resultado, { preferenciaId: '88', checkoutUrl: 'https://pago.test/88' });
  assert.equal((requestInit?.headers as Record<string, string>).Authorization, 'Bearer token-secreto');
  assert.equal(payload.external_reference, '88');
  assert.equal(payload.notification_url, 'https://magico.test/api/webhook-mp');
  assert.match(payload.items[0].title, /Domo/);
});

test('el adaptador de Mercado Pago valida la respuesta y permite checkout nulo', async () => {
  const sinUrl = new MercadoPagoCheckoutReservas('token', 'https://magico.test', async () =>
    new Response(JSON.stringify({ id: 'pref-sin-url' }), { status: 200 })
  );
  const fallida = new MercadoPagoCheckoutReservas('token', 'https://magico.test', async () =>
    new Response(JSON.stringify({ message: 'rechazada' }), { status: 400 })
  );

  assert.deepEqual(
    await sinUrl.crearPreferencia({ reservaId: 1, tipoAlojamiento: 'refugio', montoSena: 10 }),
    { preferenciaId: 'pref-sin-url', checkoutUrl: null }
  );
  await assert.rejects(
    fallida.crearPreferencia({ reservaId: 1, tipoAlojamiento: 'refugio', montoSena: 10 }),
    /Mercado Pago no pudo crear la preferencia/
  );
});
