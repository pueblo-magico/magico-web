import assert from 'node:assert/strict';
import test from 'node:test';

import { procesarPagoMercadoPago } from '../../functions/_application/reservas/procesarPagoMercadoPago.ts';
import type {
  NotificadorReservaConfirmada,
  ProveedorPagosReserva,
  RepositorioEstadoPagoReserva,
} from '../../functions/_application/reservas/ports.ts';
import { D1RepositorioEstadoPagoReserva } from '../../functions/_infrastructure/d1/D1RepositorioEstadoPagoReserva.ts';
import { ManyChatNotificadorReserva } from '../../functions/_infrastructure/manychat/ManyChatNotificadorReserva.ts';
import { MercadoPagoProveedorPagos } from '../../functions/_infrastructure/mercadopago/MercadoPagoProveedorPagos.ts';

const notificadorNulo: NotificadorReservaConfirmada = { async notificar() {} };

function pagos(estado: string, referenciaExterna: unknown = '7'): ProveedorPagosReserva {
  return { async obtenerPago() { return { id: 'pay-7', estado, referenciaExterna }; } };
}

test('confirma una reserva y notifica ManyChat una sola vez', async () => {
  let notificaciones = 0;
  const repository: RepositorioEstadoPagoReserva = {
    async confirmar() {
      return { manyChatUserId: 'mc-7', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12' };
    },
    async cancelarPendiente() {},
  };

  const resultado = await procesarPagoMercadoPago('pay-7', pagos('approved'), repository, {
    async notificar() { notificaciones += 1; },
  });

  assert.deepEqual(resultado, { estado: 'confirmada', notificacionFallida: false });
  assert.equal(notificaciones, 1);
});

test('mantiene confirmación aunque falle la notificación y omite usuarios ausentes', async () => {
  const fallida = await procesarPagoMercadoPago(
    'pay-7', pagos('approved'),
    {
      async confirmar() {
        return { manyChatUserId: 'mc-7', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12' };
      },
      async cancelarPendiente() {},
    },
    { async notificar() { throw new Error('ManyChat caído'); } }
  );
  const sinUsuario = await procesarPagoMercadoPago(
    'pay-8', pagos('approved', 8),
    {
      async confirmar() {
        return { manyChatUserId: null, fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12' };
      },
      async cancelarPendiente() {},
    },
    { async notificar() { throw new Error('no debe ejecutarse'); } }
  );

  assert.deepEqual(fallida, { estado: 'confirmada', notificacionFallida: true });
  assert.deepEqual(sinUsuario, { estado: 'confirmada', notificacionFallida: false });
});

test('cancela rechazos y cancelaciones, e ignora estados intermedios', async () => {
  const canceladas: unknown[][] = [];
  const repository: RepositorioEstadoPagoReserva = {
    async confirmar() { return null; },
    async cancelarPendiente(...valores) { canceladas.push(valores); },
  };

  const rechazada = await procesarPagoMercadoPago('1', pagos('rejected'), repository, notificadorNulo);
  const cancelada = await procesarPagoMercadoPago('2', pagos('cancelled'), repository, notificadorNulo);
  const pendiente = await procesarPagoMercadoPago('3', pagos('pending'), repository, notificadorNulo);

  assert.equal(rechazada.estado, 'cancelada');
  assert.equal(cancelada.estado, 'cancelada');
  assert.equal(pendiente.estado, 'sin_cambios');
  assert.deepEqual(canceladas, [[7, 'pay-7'], [7, 'pay-7']]);
});

test('descarta pagos ausentes o referencias inválidas', async () => {
  const repository: RepositorioEstadoPagoReserva = {
    async confirmar() { throw new Error('no debe ejecutarse'); },
    async cancelarPendiente() { throw new Error('no debe ejecutarse'); },
  };
  const ausente = await procesarPagoMercadoPago(
    'x', { async obtenerPago() { return null; } }, repository, notificadorNulo
  );
  const invalida = await procesarPagoMercadoPago('x', pagos('approved', 'abc'), repository, notificadorNulo);

  assert.equal(ausente.estado, 'pago_no_disponible');
  assert.equal(invalida.estado, 'referencia_invalida');
});

test('el repositorio D1 aplica guards idempotentes y mapea la notificación', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const rows = [
    { manychat_user_id: 'mc-9', fecha_checkin: '2026-10-10', fecha_checkout: '2026-10-12' },
    null,
  ];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) { call.values = values; return this; },
        async first() { return rows.shift() || null; },
        async run() { return {}; },
      };
    },
  };
  const repository = new D1RepositorioEstadoPagoReserva(db);

  assert.deepEqual(await repository.confirmar(9, 'pay-9'), {
    manyChatUserId: 'mc-9', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12',
  });
  assert.equal(await repository.confirmar(9, 'pay-9'), null);
  await repository.cancelarPendiente(10, 'pay-10');

  assert.match(calls[0].query, /estado != 'confirmada'/);
  assert.deepEqual(calls[0].values, ['pay-9', 9]);
  assert.match(calls[2].query, /estado = 'pendiente'/);
  assert.deepEqual(calls[2].values, ['pay-10', 10]);
});

test('el proveedor Mercado Pago verifica estado HTTP y normaliza el pago', async () => {
  let authorization = '';
  const exitoso = new MercadoPagoProveedorPagos('token', async (_url, init) => {
    authorization = (init?.headers as Record<string, string>).Authorization;
    return new Response(JSON.stringify({ id: 11, status: 'approved', external_reference: '9' }), { status: 200 });
  });
  const fallido = new MercadoPagoProveedorPagos('token', async () =>
    new Response('{}', { status: 503 })
  );

  assert.deepEqual(await exitoso.obtenerPago('11'), {
    id: '11', estado: 'approved', referenciaExterna: '9',
  });
  assert.equal(authorization, 'Bearer token');
  assert.equal(await fallido.obtenerPago('12'), null);
});

test('el notificador ManyChat envía campos y flow con el mismo usuario', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const notificador = new ManyChatNotificadorReserva('key', 'flow-ns', async (url, init) => {
    calls.push({ url, init });
    return new Response('{}', { status: 200 });
  });

  await notificador.notificar({
    manyChatUserId: 'mc-12', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12',
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /setCustomFields/);
  assert.match(calls[1].url, /sendFlow/);
  assert.equal(JSON.parse(String(calls[1].init?.body)).flow_ns, 'flow-ns');
  assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, 'Bearer key');
});
