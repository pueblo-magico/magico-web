import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { onRequestGet as disponibilidad } from '../../functions/api/v1/integrations/reservas/disponibilidad.ts';
import { onRequestPost as cotizaciones } from '../../functions/api/v1/integrations/reservas/cotizaciones.ts';
import { onRequestPost as crearReserva } from '../../functions/api/v1/integrations/reservas/index.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

function d1(sqlite: DatabaseSync) {
  return {
    prepare(query: string) {
      let values: SQLInputValue[] = [];
      return {
        bind(...bindings: unknown[]) { values = bindings as SQLInputValue[]; return this; },
        async first() { return sqlite.prepare(query).get(...values) as Record<string, unknown> | undefined || null; },
        async all() { return { results: sqlite.prepare(query).all(...values) as Record<string, unknown>[] }; },
        async run() { return sqlite.prepare(query).run(...values); },
      };
    },
    async batch(statements: { run(): Promise<unknown> }[]) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

const SECRET_MANYCHAT = 'manychat-inbound-secret-123456789';
const SECRET_N8N = 'n8n-inbound-secret-seguro-123456';

function headers(identidad: 'manychat' | 'n8n', secreto: string, json = false) {
  return {
    'X-Integration-Id': identidad,
    'X-Service-Secret': secreto,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

test('los contratos v1 aceptan sólo la identidad n8n y no exponen datos internos', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const url = 'https://test/api/v1/integrations/reservas/disponibilidad' +
    '?check_in=2027-11-10&check_out=2027-11-12&personas=2&tipo_alojamiento=domo&modalidad=privada';

  const sinCredencial = await disponibilidad({ request: new Request(url), env });
  assert.equal(sinCredencial.status, 401);
  assert.deepEqual(await sinCredencial.json(), {
    error: { codigo: 'NO_AUTORIZADO', mensaje: 'La identidad o credencial no es válida.', reintentable: false },
    meta: { version: 'v1' },
  });

  const response = await disponibilidad({
    request: new Request(url, { headers: headers('n8n', SECRET_N8N) }), env,
  });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.integracion, 'n8n');
  assert.equal(body.data.estado, 'disponible');
  assert.equal(body.data.opcion.espacio_codigo, 'domo-1');
  assert.equal(JSON.stringify(body).includes('cliente_'), false);
  assert.equal(JSON.stringify(body).includes('alojamiento_id'), false);

  const manychatDirecto = await disponibilidad({
    request: new Request(url, { headers: headers('manychat', SECRET_MANYCHAT) }), env,
  });
  assert.equal(manychatDirecto.status, 401);
  sqlite.close();
});

test('n8n cotiza con el mismo caso de uso y recibe importes versionados', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const request = new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
    method: 'POST', headers: headers('n8n', SECRET_N8N, true),
    body: JSON.stringify({
      check_in: '2027-11-10', check_out: '2027-11-12', personas: 2,
      tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      regimen_alimentacion: 'desayuno_incluido',
    }),
  });
  const response = await cotizaciones({ request, env });
  assert.equal(response.status, 200);
  const body = await response.json() as any;
  assert.equal(body.meta.version, 'v1');
  assert.equal(body.meta.integracion, 'n8n');
  assert.equal(body.data.estado, 'disponible');
  assert.equal(Number.isInteger(body.data.precio.subtotal_centavos), true);
  assert.equal(Number.isInteger(body.data.precio.sena_centavos), true);
  assert.match(body.data.cotizacion.codigo, /^COT-/);
  sqlite.close();
});

test('manychat no puede usar el secreto de n8n y los errores son consumibles', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), MANYCHAT_INBOUND_SECRET: SECRET_MANYCHAT,
    N8N_INBOUND_SECRET: SECRET_N8N, RATE_LIMIT_SALT: 'rate-limit-salt-seguro',
  };
  const response = await cotizaciones({
    request: new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
      method: 'POST', headers: headers('manychat', SECRET_N8N, true), body: '{}',
    }), env,
  });
  assert.equal(response.status, 401);
  const body = await response.json() as any;
  assert.equal(body.error.codigo, 'NO_AUTORIZADO');
  assert.equal(body.error.reintentable, false);
  sqlite.close();
});

test('n8n crea una reserva idempotente y conserva referencias externas', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), N8N_INBOUND_SECRET: SECRET_N8N,
    RATE_LIMIT_SALT: 'rate-limit-salt-seguro', CUCURU_TRANSFER_ENABLED: 'false',
  };
  const cotizacionResponse = await cotizaciones({
    request: new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
      method: 'POST', headers: headers('n8n', SECRET_N8N, true),
      body: JSON.stringify({
        check_in: '2027-12-10', check_out: '2027-12-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      }),
    }), env,
  });
  const cotizacion = await cotizacionResponse.json() as any;
  const payload = {
    cotizacion_codigo: cotizacion.data.cotizacion.codigo,
    espacio_codigo: cotizacion.data.opcion.espacio_codigo,
    contacto_id: 'contacto-n8n-42',
    conversacion_id: 'conversacion-n8n-99',
    cliente: { nombre: 'Huésped desde n8n', telefono: '+5493515550000', email: 'N8N@Example.Test' },
  };
  const request = () => new Request('https://test/api/v1/integrations/reservas', {
    method: 'POST',
    headers: { ...headers('n8n', SECRET_N8N, true), 'Idempotency-Key': 'n8n-reserva-0001' },
    body: JSON.stringify(payload),
  });

  const creada = await crearReserva({ request: request(), env });
  assert.equal(creada.status, 201);
  const bodyCreada = await creada.json() as any;
  assert.equal(bodyCreada.data.reserva.estado, 'pendiente_pago');
  assert.match(bodyCreada.data.reserva.codigo, /^RES-/);
  assert.equal(bodyCreada.data.reserva.id, undefined);
  assert.equal(bodyCreada.data.contacto_id, 'contacto-n8n-42');
  assert.equal(bodyCreada.data.cuenta_cobro.estado, 'disabled');
  assert.equal(bodyCreada.meta.integracion, 'n8n');
  assert.equal(bodyCreada.meta.idempotente, false);

  const repetida = await crearReserva({ request: request(), env });
  assert.equal(repetida.status, 200);
  const bodyRepetida = await repetida.json() as any;
  assert.equal(bodyRepetida.data.reserva.codigo, bodyCreada.data.reserva.codigo);
  assert.equal(bodyRepetida.meta.idempotente, true);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM reservas').get()?.cantidad, 1);
  assert.deepEqual({ ...sqlite.prepare(`
    SELECT rir.integracion, rir.contacto_ref, rir.conversacion_ref, r.canal_origen
    FROM reserva_integracion_referencias rir
    JOIN reservas r ON r.id = rir.reserva_id
  `).get() }, {
    integracion: 'n8n', contacto_ref: 'contacto-n8n-42',
    conversacion_ref: 'conversacion-n8n-99', canal_origen: 'n8n',
  });
  assert.equal(
    sqlite.prepare("SELECT alcance FROM solicitudes_idempotentes WHERE clave = 'n8n-reserva-0001'").get()?.alcance,
    'crear_reserva_n8n'
  );
  sqlite.close();
});

test('n8n no puede reutilizar una clave con otra referencia de contacto', async () => {
  const sqlite = baseCompleta();
  const env = {
    DB: d1(sqlite), N8N_INBOUND_SECRET: SECRET_N8N,
    RATE_LIMIT_SALT: 'rate-limit-salt-seguro', CUCURU_TRANSFER_ENABLED: 'false',
  };
  const cotizacionResponse = await cotizaciones({
    request: new Request('https://test/api/v1/integrations/reservas/cotizaciones', {
      method: 'POST', headers: headers('n8n', SECRET_N8N, true),
      body: JSON.stringify({
        check_in: '2028-01-10', check_out: '2028-01-12', personas: 2,
        tipo_alojamiento: 'domo', modalidad: 'privada', contexto: 'general',
      }),
    }), env,
  });
  const cotizacion = await cotizacionResponse.json() as any;
  const enviar = (contactoId: string) => crearReserva({
    request: new Request('https://test/api/v1/integrations/reservas', {
      method: 'POST',
      headers: { ...headers('n8n', SECRET_N8N, true), 'Idempotency-Key': 'n8n-reserva-0002' },
      body: JSON.stringify({
        cotizacion_codigo: cotizacion.data.cotizacion.codigo,
        espacio_codigo: cotizacion.data.opcion.espacio_codigo,
        contacto_id: contactoId,
        cliente: { nombre: 'Titular n8n' },
      }),
    }), env,
  });
  assert.equal((await enviar('contacto-a')).status, 201);
  const conflicto = await enviar('contacto-b');
  assert.equal(conflicto.status, 409);
  assert.equal((await conflicto.json() as any).error.codigo, 'IDEMPOTENCY_KEY_REUTILIZADA');
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM reservas').get()?.cantidad, 1);
  sqlite.close();
});
