import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { crearReservaPublica } from '../../functions/_application/reservas/crearReservaPublica.ts';
import { actualizarParametroConfiguracion } from '../../functions/_application/reservas/gestionarConfiguracionBase.ts';
import {
  normalizarPaymentHoldMinutes,
  validarCambioParametroOperativo,
} from '../../functions/_domain/reservas/baseConfiguration.ts';
import { D1RepositorioConfiguracionBaseReservas } from '../../functions/_infrastructure/d1/D1RepositorioConfiguracionBaseReservas.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import {
  onRequestGet as consultarConfiguracion,
  onRequestPatch as actualizarConfiguracion,
} from '../../functions/api/v1/admin/configuracion-reservas.ts';

function baseCompleta(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url))
    .filter(nombre => /^\d{4}_.+\.sql$/.test(nombre)).sort()) {
    db.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }
  return db;
}

type TestStatement = {
  query: string;
  values: SQLInputValue[];
  bind(...values: unknown[]): TestStatement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Record<string, unknown>[] }>;
};

function d1(sqlite: DatabaseSync) {
  return {
    prepare(query: string): TestStatement {
      return {
        query,
        values: [],
        bind(...values: unknown[]) { this.values = values as SQLInputValue[]; return this; },
        async first() {
          return sqlite.prepare(this.query).get(...this.values) as Record<string, unknown> | undefined || null;
        },
        async all() {
          return { results: sqlite.prepare(this.query).all(...this.values) as Record<string, unknown>[] };
        },
      };
    },
    async batch(statements: TestStatement[]) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => ({
          results: /^\s*UPDATE[\s\S]+RETURNING\s/i.test(statement.query)
            ? sqlite.prepare(statement.query).all(...statement.values) as Record<string, unknown>[]
            : (sqlite.prepare(statement.query).run(...statement.values), []),
        }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

test('valida límites y usa 15 minutos como fallback seguro', () => {
  assert.equal(normalizarPaymentHoldMinutes(undefined), 15);
  assert.equal(normalizarPaymentHoldMinutes(999), 15);
  assert.equal(normalizarPaymentHoldMinutes(30), 30);
  assert.throws(() => validarCambioParametroOperativo({
    codigo: 'payment_hold_minutes', valor: 4, expectedVersion: 1, motivo: 'Muy corto',
  }), /parámetro operativo es inválido/);
  assert.throws(() => validarCambioParametroOperativo({
    codigo: 'payment_hold_minutes', valor: 30, expectedVersion: 1, motivo: 'no',
  }), /motivo debe tener/);
});

test('lee fuentes efectivas y actualiza con versión y auditoría atómica', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioConfiguracionBaseReservas(d1(sqlite));
  const inicial = await repositorio.obtenerEfectiva();
  assert.equal(await repositorio.obtenerPaymentHoldMinutes(), 15);
  assert.equal(inicial.parametros[0].version, 1);
  assert.ok(inicial.inventario.some(item => item.codigo === 'domo-1' && item.capacidadComercial === 7));
  assert.equal(inicial.tarifa?.reglasSena, 2);
  assert.deepEqual(inicial.alimentacion.map(item => item.codigo), ['desayuno_incluido', 'pension_completa']);
  assert.throws(() => sqlite.prepare(`UPDATE parametros_operativos_reservas
    SET valor_entero = 121 WHERE codigo = 'payment_hold_minutes'`).run(), /constraint/i);

  const actualizado = await actualizarParametroConfiguracion({
    codigo: 'payment_hold_minutes', valor: 30, expectedVersion: 1,
    motivo: 'Ajuste operativo aprobado', actorEmail: 'admin@test', correlationId: 'req-config-1',
  }, repositorio, () => 'op-config-1');
  assert.equal(actualizado.valor, 30);
  assert.equal(actualizado.version, 2);
  assert.equal(await repositorio.obtenerPaymentHoldMinutes(), 30);
  const auditoria = sqlite.prepare(`SELECT motivo, metadata_json FROM auditoria_admin
    WHERE accion = 'actualizar_configuracion_reservas'`).get() as Record<string, unknown>;
  assert.equal(auditoria.motivo, 'Ajuste operativo aprobado');
  assert.deepEqual(JSON.parse(String(auditoria.metadata_json)), {
    codigo: 'payment_hold_minutes', valor_anterior: 15, valor_nuevo: 30,
    version_anterior: 1, version_nueva: 2, unidad: 'minutos',
  });
  await assert.rejects(actualizarParametroConfiguracion({
    codigo: 'payment_hold_minutes', valor: 45, expectedVersion: 1,
    motivo: 'Versión desactualizada', actorEmail: 'admin@test', correlationId: 'req-config-2',
  }, repositorio), /configuración cambió/);
  sqlite.close();
});

test('la creación pública usa el plazo efectivo y conserva el vencimiento calculado', async () => {
  let holdExpiresAt = '';
  const resultado = await crearReservaPublica({
    cotizacionCodigo: 'COT-CONFIG-1', espacioCodigo: 'domo-1', clienteNombre: 'QA Config',
    clienteTelefono: null, clienteEmail: null, idempotencyKey: 'config-hold-0001',
  }, {
    async buscarIdempotencia() { return null; },
    async obtenerCotizacion() {
      return {
        id: 1, codigo: 'COT-CONFIG-1', tipo: 'domo' as const, modalidad: 'privada' as const,
        contexto: 'general' as const, regimenAlimentacion: 'desayuno_incluido' as const,
        fechaCheckin: '2027-01-10', fechaCheckout: '2027-01-12', personas: 2,
        moneda: 'ARS', totalCentavos: 100_000, senaCentavos: 30_000,
        expiresAt: '2027-01-01T01:00:00.000Z',
      };
    },
    async crearAtomica(entrada) {
      holdExpiresAt = entrada.holdExpiresAt;
      return {
        reservaId: 1, codigo: entrada.reservaCodigo, estado: 'pendiente_pago' as const,
        expiresAt: entrada.holdExpiresAt, cotizacionCodigo: entrada.cotizacion.codigo,
        metodoPago: entrada.solicitud.metodoPago, idempotente: false,
      };
    },
  }, {
    async consultar() {
      return {
        estado: 'disponible' as const, alojamiento_id: 1, espacio_id: 1,
        espacio_codigo: 'domo-1', modalidad: 'privada' as const, capacidad_disponible: 7,
      };
    },
  }, { async obtenerPaymentHoldMinutes() { return 30; } },
  () => new Date('2027-01-01T00:00:00.000Z'), () => 'uuid-config-1');
  assert.equal(resultado.ok, true);
  assert.equal(holdExpiresAt, '2027-01-01T00:30:00.000Z');
});

test('el contrato permite lectura administrativa pero sólo super admin puede escribir', async () => {
  const sqlite = baseCompleta();
  sqlite.exec(`INSERT INTO usuarios_admin (email, password_hash, rol) VALUES
    ('admin@test', 'x', 'super_admin'), ('editor@test', 'x', 'editor')`);
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-config-test';
  const tokenAdmin = await createSessionToken('admin@test', secret, csrf);
  const tokenEditor = await createSessionToken('editor@test', secret, csrf);
  const cookie = (token: string) => `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const env = { DB: d1(sqlite), SESSION_SECRET: secret };

  const sinSesion = await consultarConfiguracion({
    request: new Request('https://test/api/v1/admin/configuracion-reservas'), env,
  });
  assert.equal(sinSesion.status, 401);

  const lectura = await consultarConfiguracion({
    request: new Request('https://test/api/v1/admin/configuracion-reservas', {
      headers: { Cookie: cookie(tokenEditor) },
    }), env,
  });
  assert.equal(lectura.status, 200);
  const bodyLectura = await lectura.json() as any;
  assert.equal(bodyLectura.meta.contiene_secretos, false);
  assert.doesNotMatch(JSON.stringify(bodyLectura), /SESSION_SECRET|API_KEY|TOKEN/);

  const requestPatch = (token: string, incluirCsrf = true) => new Request('https://test/api/v1/admin/configuracion-reservas', {
    method: 'PATCH',
    headers: {
      Cookie: cookie(token),
      ...(incluirCsrf ? { 'X-CSRF-Token': csrf } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codigo: 'payment_hold_minutes', valor: 20, expected_version: 1,
      motivo: 'Ajuste operativo de QA',
    }),
  });
  assert.equal((await actualizarConfiguracion({ request: requestPatch(tokenEditor), env })).status, 403);
  assert.equal((await actualizarConfiguracion({ request: requestPatch(tokenAdmin, false), env })).status, 403);
  const actualizada = await actualizarConfiguracion({ request: requestPatch(tokenAdmin), env });
  assert.equal(actualizada.status, 200);
  assert.equal((await actualizada.json() as any).data.valor, 20);
  sqlite.close();
});
