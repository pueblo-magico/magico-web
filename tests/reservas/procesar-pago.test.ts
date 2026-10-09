import assert from 'node:assert/strict';
import test from 'node:test';

import { procesarPagoMercadoPago } from '../../functions/_application/reservas/procesarPagoMercadoPago.ts';
import type {
  ProveedorPagosReserva,
  RepositorioEstadoPagoReserva,
} from '../../functions/_application/reservas/ports.ts';
import { D1RepositorioEstadoPagoReserva } from '../../functions/_infrastructure/d1/D1RepositorioEstadoPagoReserva.ts';
import {
  crearNotificadorManyChat,
  ManyChatNotificadorReserva,
} from '../../functions/_infrastructure/manychat/ManyChatNotificadorReserva.ts';
import {
  ErrorProveedorPagosTransitorio,
  MercadoPagoProveedorPagos,
} from '../../functions/_infrastructure/mercadopago/MercadoPagoProveedorPagos.ts';
import { hashDni } from '../../functions/_lib/paymentIdentity.ts';

function pagos(
  estado: string,
  referenciaExterna: unknown = '7',
  montoCentavos: number | null = 2500,
  moneda: string | null = 'ARS'
): ProveedorPagosReserva {
  return { async obtenerPago() { return { id: 'pay-7', estado, referenciaExterna, montoCentavos, moneda }; } };
}

function repositorio(overrides: Partial<RepositorioEstadoPagoReserva> = {}): RepositorioEstadoPagoReserva {
  return {
    async obtenerEsperado(reservaId) {
      return { reservaId, estadoFlujo: 'pendiente_pago', montoCentavos: 2500, moneda: 'ARS', preferenciaId: 'pref-7' };
    },
    async obtenerEstadoPago() { return null; },
    async registrarObservacion() { return true; },
    async registrarPago() {},
    async confirmar() {
      return { manyChatUserId: 'mc-7', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12' };
    },
    async cancelarPendiente() {},
    ...overrides,
  };
}

test('confirma una sola vez ante entregas duplicadas sin invocar un canal', async () => {
  let primera = true;
  const repository = repositorio({
    async registrarObservacion() { const insertada = primera; primera = false; return insertada; },
  });
  assert.deepEqual(
    await procesarPagoMercadoPago('pay-7', pagos('approved'), repository, 'delivery-1'),
    { estado: 'confirmada' }
  );
  assert.deepEqual(
    await procesarPagoMercadoPago('pay-7', pagos('approved'), repository, 'delivery-1'),
    { estado: 'duplicado' }
  );
});

test('resuelve la referencia pública RES sin mezclar ids de preview y producción', async () => {
  const codigo = 'RES-123e4567-e89b-12d3-a456-426614174000';
  let confirmada: number | null = null;
  const repository = repositorio({
    async obtenerEsperado() { throw new Error('No debe resolver un código como id numérico.'); },
    async obtenerEsperadoPorCodigo(referencia) {
      assert.equal(referencia, codigo);
      return { reservaId: 77, estadoFlujo: 'pendiente_pago', montoCentavos: 2500, moneda: 'ARS', preferenciaId: 'pref-77' };
    },
    async confirmar(reservaId) {
      confirmada = reservaId;
      return { manyChatUserId: null, fechaCheckin: '2027-01-01', fechaCheckout: '2027-01-02' };
    },
  });

  const resultado = await procesarPagoMercadoPago('pay-public', pagos('approved', codigo), repository);
  assert.deepEqual(resultado, { estado: 'confirmada' });
  assert.equal(confirmada, 77);
});

test('concilia una transferencia aprobada por DNI, importe y moneda cuando la coincidencia es única', async () => {
  let confirmada: number | null = null;
  const repository = repositorio({
    async obtenerEsperado() { return null; },
    async obtenerEsperadosPorTransferencia(documentoHash, monto, moneda) {
      assert.equal(documentoHash, 'hash-dni-12345678');
      assert.equal(monto, 4500000);
      assert.equal(moneda, 'ARS');
      return [{ reservaId: 81, estadoFlujo: 'pendiente_pago', montoCentavos: monto, moneda, preferenciaId: null }];
    },
    async confirmar(reservaId) {
      confirmada = reservaId;
      return { manyChatUserId: null, fechaCheckin: '2027-08-10', fechaCheckout: '2027-08-12' };
    },
  });
  const provider: ProveedorPagosReserva = {
    async obtenerPago() {
      return {
        id: 'transfer-81', estado: 'approved', referenciaExterna: null,
        montoCentavos: 4500000, moneda: 'ARS',
        pagadorDocumentoHash: 'hash-dni-12345678', pagadorDocumentoUltimos4: '5678',
      };
    },
  };

  const resultado = await procesarPagoMercadoPago('transfer-81', provider, repository);
  assert.deepEqual(resultado, { estado: 'confirmada' });
  assert.equal(confirmada, 81);
});

test('no confirma una transferencia cuando DNI e importe coinciden con más de una reserva', async () => {
  let confirmaciones = 0;
  const candidata = { reservaId: 81, estadoFlujo: 'pendiente_pago', montoCentavos: 4500000, moneda: 'ARS', preferenciaId: null };
  const repository = repositorio({
    async obtenerEsperado() { return null; },
    async obtenerEsperadosPorTransferencia() { return [candidata, { ...candidata, reservaId: 82 }]; },
    async confirmar() { confirmaciones += 1; return null; },
  });
  const provider: ProveedorPagosReserva = {
    async obtenerPago() {
      return {
        id: 'transfer-ambigua', estado: 'approved', referenciaExterna: null,
        montoCentavos: 4500000, moneda: 'ARS',
        pagadorDocumentoHash: 'hash-dni-12345678', pagadorDocumentoUltimos4: '5678',
      };
    },
  };

  assert.equal((await procesarPagoMercadoPago('transfer-ambigua', provider, repository)).estado, 'pago_inconsistente');
  assert.equal(confirmaciones, 0);
});

test('la confirmación no depende de que exista una identidad de mensajería', async () => {
  const conUsuario = await procesarPagoMercadoPago('pay-7', pagos('approved'), repositorio());
  const sinUsuario = await procesarPagoMercadoPago(
    'pay-8', pagos('approved', 8),
    repositorio({
      async confirmar() {
        return { manyChatUserId: null, fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12' };
      },
    })
  );

  assert.deepEqual(conUsuario, { estado: 'confirmada' });
  assert.deepEqual(sinUsuario, { estado: 'confirmada' });
});

test('registra rechazos, cancelaciones, devoluciones y estados intermedios', async () => {
  const canceladas: unknown[][] = [];
  const estados: string[] = [];
  const operaciones: string[] = [];
  const repository = repositorio({
    async registrarPago(_observacion, estado) { estados.push(estado); operaciones.push(`pago:${estado}`); },
    async cancelarPendiente(...valores) { canceladas.push(valores); operaciones.push('cancelar'); },
  });

  const rechazada = await procesarPagoMercadoPago('1', pagos('rejected'), repository);
  const cancelada = await procesarPagoMercadoPago('2', pagos('cancelled'), repository);
  const pendiente = await procesarPagoMercadoPago('3', pagos('pending'), repository);
  const devuelta = await procesarPagoMercadoPago('4', pagos('refunded'), repository);

  assert.equal(rechazada.estado, 'cancelada');
  assert.equal(cancelada.estado, 'cancelada');
  assert.equal(pendiente.estado, 'sin_cambios');
  assert.equal(devuelta.estado, 'sin_cambios');
  assert.deepEqual(canceladas, [[7, 'pay-7'], [7, 'pay-7']]);
  assert.deepEqual(estados, ['rechazado', 'rechazado', 'pendiente', 'devuelto']);
  assert.deepEqual(operaciones.slice(0, 2), ['cancelar', 'pago:rechazado']);
});

test('conserva inconsistencias sin confirmar monto, moneda o referencia incorrectos', async () => {
  let confirmaciones = 0;
  const repository = repositorio({
    async confirmar() { confirmaciones += 1; return null; },
  });
  const ausente = await procesarPagoMercadoPago(
    'x', { async obtenerPago() { return null; } }, repository
  );
  const invalida = await procesarPagoMercadoPago('x', pagos('approved', 'abc'), repository);
  const monto = await procesarPagoMercadoPago('x', pagos('approved', '7', 2600), repository, 'monto');
  const moneda = await procesarPagoMercadoPago('x', pagos('approved', '7', 2500, 'USD'), repository, 'moneda');

  assert.equal(ausente.estado, 'pago_no_disponible');
  assert.equal(invalida.estado, 'referencia_invalida');
  assert.equal(monto.estado, 'pago_inconsistente');
  assert.equal(moneda.estado, 'pago_inconsistente');
  assert.equal(confirmaciones, 0);
});

test('rechaza regresiones de un intento de pago ya aprobado', async () => {
  let pagosRegistrados = 0;
  const repository = repositorio({
    async obtenerEstadoPago() { return 'aprobado'; },
    async registrarPago() { pagosRegistrados += 1; },
  });

  const resultado = await procesarPagoMercadoPago(
    'pay-7', pagos('pending'), repository, 'delivery-regresiva'
  );

  assert.equal(resultado.estado, 'pago_inconsistente');
  assert.equal(pagosRegistrados, 0);
});

test('el repositorio D1 aplica ledger, upsert y transición guardada', async () => {
  const calls: { query: string; values: unknown[] }[] = [];
  const db = {
    prepare(query: string) {
      const call = { query, values: [] as unknown[] };
      calls.push(call);
      return {
        bind(...values: unknown[]) { call.values = values; return this; },
        async first() {
          if (query.includes('SELECT id, estado_flujo')) return { id: 9, estado_flujo: 'pendiente_pago', monto_centavos: 2500, moneda: 'ARS', mp_preference_id: 'pref-9' };
          if (query.includes('INSERT INTO pago_eventos_externos')) return { id: 1 };
          if (query.includes("UPDATE reservas SET estado = 'confirmada'")) return { manychat_user_id: 'mc-9', fecha_checkin: '2026-10-10', fecha_checkout: '2026-10-12' };
          return null;
        },
        async run() { return {}; },
      };
    },
    async batch(statements: { run(): Promise<unknown> }[]) {
      return Promise.all(statements.map(statement => statement.run()));
    },
  };
  const repository = new D1RepositorioEstadoPagoReserva(db);

  assert.equal((await repository.obtenerEsperado(9))?.montoCentavos, 2500);
  const observacion = {
    proveedor: 'mercado_pago', eventoExternoId: 'delivery-9', correlationId: 'request-9',
    pago: { id: 'pay-9', estado: 'approved', referenciaExterna: '9', montoCentavos: 2500, moneda: 'ARS' },
    reservaId: 9, resultado: 'aplicado' as const, motivoCodigo: null,
  };
  assert.equal(await repository.registrarObservacion(observacion), true);
  await repository.registrarPago(observacion, 'aprobado');
  assert.deepEqual(await repository.confirmar(9, 'pay-9'), {
    manyChatUserId: 'mc-9', fechaCheckin: '2026-10-10', fechaCheckout: '2026-10-12',
  });
  await repository.cancelarPendiente(10, 'pay-10');

  assert.ok(calls.some(call => /ON CONFLICT \(proveedor, evento_externo_id\)/.test(call.query)));
  assert.ok(calls.some(call => /estado_flujo = 'pendiente_pago'/.test(call.query)));
});

test('el proveedor Mercado Pago verifica estado HTTP y normaliza el pago', async () => {
  let authorization = '';
  const exitoso = new MercadoPagoProveedorPagos('token', async (_url, init) => {
    authorization = (init?.headers as Record<string, string>).Authorization;
    return new Response(JSON.stringify({ id: 11, status: 'approved', external_reference: '9', transaction_amount: 25, currency_id: 'ars' }), { status: 200 });
  });
  const fallido = new MercadoPagoProveedorPagos('token', async () =>
    new Response('{}', { status: 503 })
  );
  const sinRed = new MercadoPagoProveedorPagos('token', async () => {
    throw new TypeError('fetch failed');
  });

  assert.deepEqual(await exitoso.obtenerPago('11'), {
    id: '11', estado: 'approved', referenciaExterna: '9', montoCentavos: 2500, moneda: 'ARS',
    pagadorDocumentoHash: null, pagadorDocumentoUltimos4: null,
  });
  assert.equal(authorization, 'Bearer token');
  await assert.rejects(() => fallido.obtenerPago('12'), ErrorProveedorPagosTransitorio);
  await assert.rejects(() => sinRed.obtenerPago('13'), ErrorProveedorPagosTransitorio);
});

test('el proveedor protege el DNI informado por Mercado Pago con el mismo HMAC de la reserva', async () => {
  const secreto = 'secreto-de-conciliacion-mercado-pago-32-chars';
  const proveedor = new MercadoPagoProveedorPagos(secreto, secreto, async () =>
    new Response(JSON.stringify({
      id: 14,
      status: 'approved',
      external_reference: null,
      transaction_amount: 45_000,
      currency_id: 'ARS',
      payer: { identification: { type: 'DNI', number: '12.345.678' } },
    }), { status: 200 })
  );

  const pago = await proveedor.obtenerPago('14');

  assert.equal(pago?.pagadorDocumentoHash, await hashDni('12345678', secreto));
  assert.equal(pago?.pagadorDocumentoUltimos4, '5678');
  assert.doesNotMatch(JSON.stringify(pago), /12\.345\.678/);
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

test('omite ManyChat sin credenciales salientes y conserva el adaptador real cuando existen', async () => {
  const logs: string[] = [];
  const fetches: string[] = [];
  const fetcher = async (url: string) => {
    fetches.push(url);
    return new Response('{}', { status: 200 });
  };
  const reserva = {
    manyChatUserId: 'mc-preview',
    fechaCheckin: '2026-10-10',
    fechaCheckout: '2026-10-12',
  };

  const deshabilitado = crearNotificadorManyChat({}, fetcher, mensaje => logs.push(mensaje));
  await deshabilitado.notificar(reserva);

  assert.equal(fetches.length, 0);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /omitida/);

  const apagado = crearNotificadorManyChat(
    { apiKey: 'key', flowNs: 'flow-ns', habilitado: 'false' },
    fetcher,
    mensaje => logs.push(mensaje)
  );
  await apagado.notificar(reserva);
  assert.equal(fetches.length, 0);
  assert.equal(logs.length, 2);

  const habilitado = crearNotificadorManyChat(
    { apiKey: 'key', flowNs: 'flow-ns', habilitado: 'true' },
    fetcher
  );
  await habilitado.notificar(reserva);
  assert.equal(fetches.length, 2);
});
