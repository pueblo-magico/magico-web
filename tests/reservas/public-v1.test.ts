import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { D1RepositorioDisponibilidad } from '../../functions/_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { D1RepositorioCreacionReservaPublica } from '../../functions/_infrastructure/d1/D1RepositorioCreacionReservaPublica.ts';
import { crearReservaPublica } from '../../functions/_application/reservas/crearReservaPublica.ts';
import { onRequestGet as listarAlojamientos } from '../../functions/api/v1/public/alojamientos.ts';
import { onRequestGet as consultarDisponibilidad } from '../../functions/api/v1/public/disponibilidad.ts';
import { onRequestPost as crearCotizacion } from '../../functions/api/v1/public/cotizaciones.ts';
import { onRequestPost as crearReserva } from '../../functions/api/v1/public/reservas.ts';
import { onRequestGet as consultarEstadoReserva } from '../../functions/api/v1/public/reservas/[codigo].ts';
import { onRequestPost as expirarRetenciones } from '../../functions/api/v1/integrations/reservas/expirar-retenciones.ts';

function baseMigrada() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(item => /^\d{4}_.+\.sql$/.test(item)).sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }

  class Statement {
    private values: unknown[] = [];
    constructor(privateQuery: string) { this.query = privateQuery; }
    readonly query: string;
    bind(...values: unknown[]) { this.values = values; return this; }
    async first() { return sqlite.prepare(this.query).get(...this.values as any[]) as Record<string, unknown> | null; }
    async all() { return { results: sqlite.prepare(this.query).all(...this.values as any[]) as Record<string, unknown>[] }; }
    async run() { return sqlite.prepare(this.query).run(...this.values as any[]); }
  }

  const db = {
    prepare(query: string) { return new Statement(query); },
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        for (const statement of statements) {
          results.push(/\bRETURNING\b/i.test(statement.query)
            ? await statement.all()
            : await statement.run());
        }
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return {
    sqlite,
    db,
  };
}

function insertarReserva(
  sqlite: DatabaseSync,
  alojamientoId: number,
  checkIn: string,
  checkOut: string,
  personas: number,
  estado = 'confirmada'
) {
  sqlite.prepare(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA', ?, ?, ?, ?, 0, ?, 'QA')
  `).run(alojamientoId, checkIn, checkOut, personas, estado);
}

function env(db: unknown) {
  return { DB: db, RATE_LIMIT_SALT: 'qa-rate-limit-salt-wreserv-11' };
}

test('el catálogo v1 publica capacidades comerciales sin PII ni ids internos', async () => {
  const { sqlite, db } = baseMigrada();
  const response = await listarAlojamientos({
    request: new Request('https://test/api/v1/public/alojamientos?contexto=general'),
    env: env(db),
  });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  const domos = body.data.filter((item: any) => item.tipo === 'domo');
  assert.equal(domos.length, 2);
  assert.ok(domos.every((item: any) => item.capacidad_comercial === 7));
  assert.ok(domos.every((item: any) => !('id' in item) && !('parent_id' in item)));
  assert.doesNotMatch(JSON.stringify(body), /cliente_|email|telefono/i);
  sqlite.close();
});

test('la disponibilidad v1 usa checkout exclusivo y bloquea sólo solapamientos reales', async () => {
  const { sqlite, db } = baseMigrada();
  insertarReserva(sqlite, 1, '2027-04-10', '2027-04-12', 2);
  insertarReserva(sqlite, 2, '2027-04-10', '2027-04-12', 2);

  const ocupada = await consultarDisponibilidad({
    request: new Request('https://test/api/v1/public/disponibilidad?check_in=2027-04-11&check_out=2027-04-12&personas=2&tipo_alojamiento=domo'),
    env: env(db),
  });
  const bodyOcupado = await ocupada.json() as any;
  assert.equal(bodyOcupado.data.estado, 'ocupado');
  assert.equal(bodyOcupado.data.motivo_codigo, 'INVENTARIO_OCUPADO');
  assert.equal(bodyOcupado.data.opcion, null);

  const checkout = await consultarDisponibilidad({
    request: new Request('https://test/api/v1/public/disponibilidad?check_in=2027-04-12&check_out=2027-04-13&personas=2&tipo_alojamiento=domo'),
    env: env(db),
  });
  const bodyCheckout = await checkout.json() as any;
  assert.equal(bodyCheckout.data.estado, 'disponible');
  assert.equal(bodyCheckout.data.opcion.espacio_codigo, 'domo-1');
  assert.equal(bodyCheckout.meta.intervalo, '[check_in, check_out)');
  sqlite.close();
});

test('el refugio compartido toma la mayor ocupación nocturna del rango', async () => {
  const { sqlite, db } = baseMigrada();
  insertarReserva(sqlite, 3, '2027-05-10', '2027-05-11', 4);
  insertarReserva(sqlite, 3, '2027-05-11', '2027-05-12', 10);
  const repo = new D1RepositorioDisponibilidad(db);

  const cinco = await repo.consultar({
    tipo: 'refugio', modalidad: 'compartida', personas: 5,
    fechaEntrada: '2027-05-10', fechaSalida: '2027-05-12',
  });
  const seis = await repo.consultar({
    tipo: 'refugio', modalidad: 'compartida', personas: 6,
    fechaEntrada: '2027-05-10', fechaSalida: '2027-05-12',
  });
  assert.equal(cinco.estado, 'disponible');
  assert.equal(cinco.capacidad_disponible, 5);
  assert.equal(seis.estado, 'ocupado');
  sqlite.close();
});

test('la habitación privada del refugio respeta capacidad 4 y bloquea ocupación relacionada', async () => {
  const { sqlite, db } = baseMigrada();
  const repo = new D1RepositorioDisponibilidad(db);
  const libre = await repo.consultar({
    tipo: 'refugio', modalidad: 'privada', personas: 4,
    fechaEntrada: '2027-06-01', fechaSalida: '2027-06-03',
  });
  assert.equal(libre.estado, 'disponible');
  assert.equal(libre.espacio_codigo, 'refugio-habitacion-4');
  assert.equal(libre.capacidad_disponible, 4);

  insertarReserva(sqlite, 3, '2027-06-01', '2027-06-03', 1);
  const bloqueada = await repo.consultar({
    tipo: 'refugio', modalidad: 'privada', personas: 1,
    fechaEntrada: '2027-06-01', fechaSalida: '2027-06-03',
  });
  assert.equal(bloqueada.estado, 'ocupado');
  assert.equal(bloqueada.capacidad_disponible, 0);
  sqlite.close();
});

test('cotizaciones v1 rechaza fechas inexistentes y devuelve importes enteros versionados', async () => {
  const { sqlite, db } = baseMigrada();
  const invalida = await crearCotizacion({
    request: new Request('https://test/api/v1/public/cotizaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in: '2027-02-30', check_out: '2027-03-03', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada',
      }),
    }),
    env: env(db),
  });
  assert.equal(invalida.status, 400);
  assert.equal((await invalida.json() as any).error.codigo, 'FECHAS_INVALIDAS');

  const valida = await crearCotizacion({
    request: new Request('https://test/api/v1/public/cotizaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in: '2027-04-10', check_out: '2027-04-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      }),
    }),
    env: env(db),
  });
  assert.equal(valida.status, 200);
  const body = await valida.json() as any;
  assert.equal(body.data.precio.moneda, 'ARS');
  assert.equal(body.data.precio.plan_codigo, 'alojamiento-base');
  assert.equal(body.data.precio.plan_version, 1);
  assert.equal(body.data.precio.regimen_alimentacion, 'desayuno_incluido');
  assert.equal(body.data.precio.alimentacion_centavos, 0);
  assert.ok(Number.isInteger(body.data.precio.subtotal_centavos));
  assert.ok(Number.isInteger(body.data.precio.sena_centavos));
  assert.equal(body.data.precio.desglose_noches.length, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM cotizaciones').get()?.cantidad, 1);
  sqlite.close();
});

test('cotiza pensión completa con dos comidas de ARS 20.000 por persona y noche', async () => {
  const { sqlite, db } = baseMigrada();
  const response = await crearCotizacion({
    request: new Request('https://test/api/v1/public/cotizaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in: '2027-04-10', check_out: '2027-04-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
        regimen_alimentacion: 'pension_completa',
      }),
    }),
    env: env(db),
  });

  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.data.precio.alojamiento_centavos, 15_000_000);
  assert.equal(body.data.precio.alimentacion_centavos, 16_000_000);
  assert.equal(body.data.precio.subtotal_centavos, 31_000_000);
  assert.equal(body.data.precio.sena_centavos, 9_300_000);
  assert.equal(body.data.precio.precio_comida_centavos, 2_000_000);
  assert.equal(body.data.precio.comidas_adicionales_por_persona_noche, 2);

  const snapshot = sqlite.prepare(`
    SELECT regimen_alimentacion, tarifa_alimentacion_version,
           alojamiento_centavos, alimentacion_centavos, subtotal_centavos
    FROM cotizaciones ORDER BY id DESC LIMIT 1
  `).get();
  assert.deepEqual({ ...snapshot }, {
    regimen_alimentacion: 'pension_completa', tarifa_alimentacion_version: 1,
    alojamiento_centavos: 15_000_000, alimentacion_centavos: 16_000_000,
    subtotal_centavos: 31_000_000,
  });
  sqlite.close();
});

test('rechaza regímenes de alimentación fuera del contrato', async () => {
  const { sqlite, db } = baseMigrada();
  const response = await crearCotizacion({
    request: new Request('https://test/api/v1/public/cotizaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in: '2027-04-10', check_out: '2027-04-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada',
        regimen_alimentacion: 'media_pension',
      }),
    }),
    env: env(db),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json() as any).error.codigo, 'REGIMEN_ALIMENTACION_INVALIDO');
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM cotizaciones').get()?.cantidad, 0);
  sqlite.close();
});

async function cotizarDomo(db: unknown) {
  const response = await crearCotizacion({
    request: new Request('https://test/api/v1/public/cotizaciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in: '2027-08-10', check_out: '2027-08-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      }),
    }),
    env: env(db),
  });
  assert.equal(response.status, 200);
  return response.json() as Promise<any>;
}

function requestReserva(cotizacionCodigo: string, clave: string, nombre = 'Huésped QA') {
  return new Request('https://test/api/v1/public/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': clave },
    body: JSON.stringify({
      cotizacion_codigo: cotizacionCodigo,
      espacio_codigo: 'domo-1',
      cliente: { nombre, email: 'QA@Example.Test' },
    }),
  });
}

test('crea una retención atómica y un retry devuelve la misma reserva', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const codigo = quote.data.cotizacion.codigo;

  const creada = await crearReserva({ request: requestReserva(codigo, 'qa-create-0001'), env: env(db) });
  assert.equal(creada.status, 201);
  const bodyCreada = await creada.json() as any;
  assert.equal(bodyCreada.data.reserva.estado, 'pendiente_pago');
  assert.deepEqual(bodyCreada.data.cuenta_cobro, { proveedor: 'cucuru', estado: 'disabled' });
  assert.equal(bodyCreada.meta.idempotente, false);

  const retry = await crearReserva({ request: requestReserva(codigo, 'qa-create-0001'), env: env(db) });
  assert.equal(retry.status, 200);
  const bodyRetry = await retry.json() as any;
  assert.equal(bodyRetry.data.reserva.id, bodyCreada.data.reserva.id);
  assert.equal(bodyRetry.meta.idempotente, true);

  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM retenciones_reserva').get()?.n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM cuentas_cobro_reserva WHERE estado = 'disabled'").get()?.n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ocupacion_reserva_noches').get()?.n, 2);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado_configuracion, codigo, version
    FROM reserva_politica_snapshots
  `).get() }, {
    estado_configuracion: 'pendiente_configuracion',
    codigo: 'reservas-general',
    version: 1,
  });
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM reserva_eventos WHERE tipo IN ('reserva.creada', 'reserva.retencion_iniciada')").get()?.n, 2);
  assert.equal(sqlite.prepare('SELECT cliente_email FROM reservas').get()?.cliente_email, 'qa@example.test');
  sqlite.close();
});

test('crea una preferencia Mercado Pago una sola vez y expone su estado sin PII', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const request = requestReserva(quote.data.cotizacion.codigo, 'qa-mp-checkout-0001');
  const entornoMp = {
    ...env(db),
    MP_CHECKOUT_ENABLED: 'true',
    MP_ACCESS_TOKEN: 'TEST-token-no-log',
    MP_TRANSFER_ENABLED: 'true',
    MP_TRANSFER_ALIAS: 'pueblo.magico.test',
    MP_TRANSFER_CVU: '0000003100012345678901',
    MP_TRANSFER_ACCOUNT_HOLDER: 'Pueblo Mágico',
    PAYMENT_RECONCILIATION_SECRET: 'qa-secret-mercado-pago-32-caracteres-minimo',
  };
  const originalFetch = globalThis.fetch;
  const llamadas: Array<{ url: string; method: string; body?: string }> = [];
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    llamadas.push({ url, method: init?.method || 'GET', body: init?.body ? String(init.body) : undefined });
    if (url.includes('/checkout/preferences/search')) {
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }
    return new Response(JSON.stringify({
      id: 'pref-publica-1',
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-publica-1',
    }), { status: 201 });
  };

  try {
    const creada = await crearReserva({ request, env: entornoMp });
    assert.equal(creada.status, 201);
    const body = await creada.json() as any;
    assert.deepEqual(body.data.pago, {
      proveedor: 'mercado_pago',
      estado: 'ready',
      checkout_url: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-publica-1',
    });
    assert.deepEqual(body.data.transferencia, {
      proveedor: 'mercado_pago_cuenta',
      estado: 'disabled',
    });
    assert.equal(llamadas.length, 2);
    assert.match(llamadas[0].url, new RegExp(`external_reference=${encodeURIComponent(body.data.reserva.codigo)}`));
    assert.equal(JSON.parse(llamadas[1].body || '{}').external_reference, body.data.reserva.codigo);
    assert.equal(sqlite.prepare('SELECT mp_preference_id FROM reservas').get()?.mp_preference_id, 'pref-publica-1');
    assert.deepEqual({ ...sqlite.prepare(`
      SELECT proveedor, estado, external_preference_id,
             json_extract(metadata_json, '$.estado_checkout') estado_checkout
      FROM pagos WHERE proveedor = 'mercado_pago'
    `).get() }, {
      proveedor: 'mercado_pago', estado: 'pendiente',
      external_preference_id: 'pref-publica-1', estado_checkout: 'listo',
    });

    const retry = await crearReserva({
      request: requestReserva(quote.data.cotizacion.codigo, 'qa-mp-checkout-0001'),
      env: entornoMp,
    });
    assert.equal(retry.status, 200);
    assert.equal((await retry.json() as any).data.pago.estado, 'ready');
    assert.equal(llamadas.length, 2);
    assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM pagos WHERE proveedor = 'mercado_pago'").get()?.n, 1);

    const estado = await consultarEstadoReserva({
      request: new Request(`https://test/api/v1/public/reservas/${body.data.reserva.codigo}`),
      env: entornoMp,
      params: { codigo: body.data.reserva.codigo },
    });
    const bodyEstado = await estado.json() as any;
    assert.equal(estado.status, 200);
    assert.equal(bodyEstado.data.reserva.codigo, body.data.reserva.codigo);
    assert.equal(bodyEstado.data.reserva.estado, 'pendiente_pago');
    assert.equal(bodyEstado.data.pago.estado, 'pendiente');
    assert.doesNotMatch(JSON.stringify(bodyEstado), /cliente_|email|telefono|checkout_url/i);
  } finally {
    globalThis.fetch = originalFetch;
    sqlite.close();
  }
});

test('registra una transferencia por DNI protegido y sólo entonces expone el destino', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const entornoTransferencia = {
    ...env(db),
    MP_TRANSFER_ENABLED: 'true',
    MP_TRANSFER_ALIAS: 'pueblo.magico.test',
    MP_TRANSFER_CVU: '0000003100012345678901',
    MP_TRANSFER_ACCOUNT_HOLDER: 'Pueblo Mágico',
    PAYMENT_RECONCILIATION_SECRET: 'qa-secret-mercado-pago-32-caracteres-minimo',
  };
  const request = new Request('https://test/api/v1/public/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'qa-transferencia-dni-0001' },
    body: JSON.stringify({
      cotizacion_codigo: quote.data.cotizacion.codigo,
      espacio_codigo: 'domo-1',
      cliente: { nombre: 'Huésped Transferencia', email: 'qa@example.test' },
      pago: {
        metodo: 'transferencia_mp',
        pagador: { documento_tipo: 'DNI', documento_numero: '12.345.678' },
      },
    }),
  });

  const response = await crearReserva({ request, env: entornoTransferencia });
  assert.equal(response.status, 201);
  const body = await response.json() as any;
  assert.equal(body.data.pago.estado, 'disabled');
  assert.deepEqual(body.data.transferencia, {
    proveedor: 'mercado_pago_cuenta', estado: 'ready', confirmacion: 'webhook_dni',
    destino: {
      alias: 'pueblo.magico.test', cvu: '0000003100012345678901',
      titular: 'Pueblo Mágico', moneda: 'ARS',
    },
  });
  const metodo = sqlite.prepare(`
    SELECT metodo, pagador_documento_hash, pagador_documento_ultimos4
    FROM reserva_metodos_pago
  `).get() as any;
  assert.equal(metodo.metodo, 'transferencia_mp');
  assert.match(String(metodo.pagador_documento_hash), /^[a-f0-9]{64}$/);
  assert.equal(metodo.pagador_documento_ultimos4, '5678');
  assert.doesNotMatch(
    JSON.stringify(body),
    /"pagador_documento_hash"|"pagador_documento_ultimos4"|"documento_numero"/,
  );
  sqlite.close();
});

test('Preview puede provisionar un destino mock visible, durable e idempotente', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const entornoMock = {
    ...env(db),
    CUCURU_TRANSFER_ENABLED: 'true',
    CUCURU_PROVIDER_MODE: 'mock',
    CUCURU_MOCK_ALLOWED: 'true',
    CUCURU_ALIAS_PREFIX: 'magico.qa',
  };

  const primera = await crearReserva({
    request: requestReserva(quote.data.cotizacion.codigo, 'qa-cucuru-mock-0001'),
    env: entornoMock,
  });
  assert.equal(primera.status, 201);
  const bodyPrimera = await primera.json() as any;
  assert.equal(bodyPrimera.data.cuenta_cobro.proveedor, 'cucuru_mock');
  assert.equal(bodyPrimera.data.cuenta_cobro.estado, 'ready');
  assert.equal(bodyPrimera.data.cuenta_cobro.simulado, true);
  assert.match(bodyPrimera.data.cuenta_cobro.destino.cvu, /^99\d{20}$/);
  assert.match(bodyPrimera.data.cuenta_cobro.destino.alias, /^magico\.qa\.reserva\d+$/);

  const retry = await crearReserva({
    request: requestReserva(quote.data.cotizacion.codigo, 'qa-cucuru-mock-0001'),
    env: entornoMock,
  });
  const bodyRetry = await retry.json() as any;
  assert.equal(retry.status, 200);
  assert.equal(bodyRetry.data.reserva.id, bodyPrimera.data.reserva.id);
  assert.equal(bodyRetry.data.cuenta_cobro.destino.cvu, bodyPrimera.data.cuenta_cobro.destino.cvu);
  assert.equal(bodyRetry.meta.idempotente, true);

  assert.deepEqual({ ...sqlite.prepare(`
    SELECT estado, simulada, COUNT(*) OVER () AS cantidad
    FROM cuentas_cobro_reserva
  `).get() }, { estado: 'ready', simulada: 1, cantidad: 1 });
  sqlite.close();
});

test('la reserva conserva la política publicada que aceptó la cotización', async () => {
  const { sqlite, db } = baseMigrada();
  sqlite.prepare(`
    INSERT INTO politicas_cancelacion (
      codigo, nombre, version, estado, reglas_json, vigencia_desde, publicado_at
    ) VALUES (
      'reservas-general', 'Política QA', 2, 'publicada',
      '{"estado":"configurada","reglas":[{"horas_minimas_antes":0,"porcentaje_devolucion_bps":0}]}',
      '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
    )
  `).run();

  const quote = await cotizarDomo(db);
  const cotizacion = sqlite.prepare(`
    SELECT politica_cancelacion_version, politica_cancelacion_estado
    FROM cotizaciones WHERE codigo = ?
  `).get(quote.data.cotizacion.codigo);
  assert.deepEqual({ ...cotizacion }, {
    politica_cancelacion_version: 2,
    politica_cancelacion_estado: 'publicada',
  });

  const creada = await crearReserva({
    request: requestReserva(quote.data.cotizacion.codigo, 'qa-politica-0001'), env: env(db),
  });
  assert.equal(creada.status, 201);
  const snapshot = sqlite.prepare(`
    SELECT codigo, version, estado_configuracion, aceptada_at
    FROM reserva_politica_snapshots
  `).get();
  assert.equal(snapshot?.codigo, 'reservas-general');
  assert.equal(snapshot?.version, 2);
  assert.equal(snapshot?.estado_configuracion, 'configurada');
  assert.ok(snapshot?.aceptada_at);
  sqlite.close();
});

test('rechaza reutilizar la clave con otro payload y evita la sobreventa', async () => {
  const { sqlite, db } = baseMigrada();
  const primeraQuote = await cotizarDomo(db);
  const segundaQuote = await cotizarDomo(db);
  const primera = await crearReserva({
    request: requestReserva(primeraQuote.data.cotizacion.codigo, 'qa-create-0002'), env: env(db),
  });
  assert.equal(primera.status, 201);

  const claveReutilizada = await crearReserva({
    request: requestReserva(primeraQuote.data.cotizacion.codigo, 'qa-create-0002', 'Otra persona'), env: env(db),
  });
  assert.equal(claveReutilizada.status, 409);
  assert.equal((await claveReutilizada.json() as any).error.codigo, 'IDEMPOTENCY_KEY_REUTILIZADA');

  const competidora = await crearReserva({
    request: requestReserva(segundaQuote.data.cotizacion.codigo, 'qa-create-0003'), env: env(db),
  });
  assert.equal(competidora.status, 409);
  assert.equal((await competidora.json() as any).error.codigo, 'INVENTARIO_NO_DISPONIBLE');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n, 1);
  sqlite.close();
});

test('la restricción D1 evita sobreventa aunque dos chequeos hayan visto disponibilidad', async () => {
  const { sqlite, db } = baseMigrada();
  const primeraQuote = await cotizarDomo(db);
  const segundaQuote = await cotizarDomo(db);
  const primera = await crearReserva({
    request: requestReserva(primeraQuote.data.cotizacion.codigo, 'qa-race-0001'), env: env(db),
  });
  assert.equal(primera.status, 201);

  const resultado = await crearReservaPublica({
    cotizacionCodigo: segundaQuote.data.cotizacion.codigo,
    espacioCodigo: 'domo-1',
    clienteNombre: 'Carrera QA',
    clienteTelefono: null,
    clienteEmail: null,
    idempotencyKey: 'qa-race-0002',
  }, new D1RepositorioCreacionReservaPublica(db), {
    async consultar() {
      return {
        estado: 'disponible', alojamiento_id: 1, motivo_codigo: 'DISPONIBLE',
        espacio_id: 1, espacio_codigo: 'domo-1', modalidad: 'privada', capacidad_disponible: 7,
      };
    },
  }, { async obtenerPaymentHoldMinutes() { return 15; } });

  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.equal(resultado.error.codigo, 'INVENTARIO_NO_DISPONIBLE');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM solicitudes_idempotentes WHERE clave = 'qa-race-0002'").get()?.n, 0);
  sqlite.close();
});

test('confirmar una reserva convierte la retención y protege estados finales', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const creada = await crearReserva({
    request: requestReserva(quote.data.cotizacion.codigo, 'qa-confirm-0001'), env: env(db),
  });
  assert.equal(creada.status, 201);
  sqlite.prepare("UPDATE reservas SET estado = 'confirmada' WHERE codigo = ?")
    .run((await creada.json() as any).data.reserva.codigo);

  assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas').get()?.estado_flujo, 'confirmada');
  assert.equal(sqlite.prepare('SELECT estado FROM retenciones_reserva').get()?.estado, 'convertida');
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM ocupacion_reserva_noches WHERE estado = 'confirmada'").get()?.n, 2);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM reserva_eventos WHERE tipo = 'reserva.confirmada'").get()?.n, 1);
  sqlite.prepare("UPDATE reservas SET estado_flujo = 'cancelada'").run();
  assert.equal(sqlite.prepare('SELECT estado_flujo FROM reservas').get()?.estado_flujo, 'cancelada');
  assert.throws(
    () => sqlite.prepare("UPDATE reservas SET estado_flujo = 'confirmada'").run(),
    /transicion de reserva invalida/
  );
  sqlite.close();
});

test('exige clave idempotente y rechaza cotizaciones vencidas', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const codigo = quote.data.cotizacion.codigo;
  const sinClave = await crearReserva({ request: requestReserva(codigo, ''), env: env(db) });
  assert.equal(sinClave.status, 400);
  assert.equal((await sinClave.json() as any).error.codigo, 'IDEMPOTENCY_KEY_REQUERIDA');

  sqlite.prepare("UPDATE cotizaciones SET expires_at = '2000-01-01T00:00:00.000Z' WHERE codigo = ?").run(codigo);
  const vencida = await crearReserva({ request: requestReserva(codigo, 'qa-create-0004'), env: env(db) });
  assert.equal(vencida.status, 410);
  assert.equal((await vencida.json() as any).error.codigo, 'COTIZACION_VENCIDA');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n, 0);
  sqlite.close();
});

test('vence retenciones de forma idempotente y libera la disponibilidad', async () => {
  const { sqlite, db } = baseMigrada();
  const quote = await cotizarDomo(db);
  const creada = await crearReserva({
    request: requestReserva(quote.data.cotizacion.codigo, 'qa-create-0005'), env: env(db),
  });
  assert.equal(creada.status, 201);
  sqlite.exec(`
    UPDATE reservas SET hold_expires_at = '2000-01-01T00:00:00.000Z';
    UPDATE retenciones_reserva SET expires_at = '2000-01-01T00:00:00.000Z';
  `);

  const noAutorizada = await expirarRetenciones({
    request: new Request('https://test/api/v1/integrations/reservas/expirar-retenciones', { method: 'POST' }),
    env: { ...env(db), N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-pruebas-123' },
  });
  assert.equal(noAutorizada.status, 401);

  const request = () => new Request('https://test/api/v1/integrations/reservas/expirar-retenciones', {
    method: 'POST', headers: { 'X-Service-Secret': 'n8n-secret-seguro-de-pruebas-123' },
  });
  const expirada = await expirarRetenciones({
    request: request(), env: { ...env(db), N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-pruebas-123' },
  });
  assert.equal(expirada.status, 200);
  assert.equal((await expirada.json() as any).expiradas, 1);

  const retry = await expirarRetenciones({
    request: request(), env: { ...env(db), N8N_INBOUND_SECRET: 'n8n-secret-seguro-de-pruebas-123' },
  });
  assert.equal((await retry.json() as any).expiradas, 0);
  assert.deepEqual({ ...sqlite.prepare('SELECT estado, estado_flujo FROM reservas').get() }, {
    estado: 'cancelada', estado_flujo: 'vencida',
  });
  assert.equal(sqlite.prepare('SELECT estado FROM retenciones_reserva').get()?.estado, 'vencida');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ocupacion_reserva_noches WHERE estado = \'liberada\'').get()?.n, 2);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM reserva_eventos WHERE tipo = 'reserva.retencion_vencida'").get()?.n, 1);

  const disponible = await consultarDisponibilidad({
    request: new Request('https://test/api/v1/public/disponibilidad?check_in=2027-08-10&check_out=2027-08-12&personas=2&tipo_alojamiento=domo&modalidad=privada'),
    env: env(db),
  });
  assert.equal((await disponible.json() as any).data.estado, 'disponible');
  sqlite.close();
});
