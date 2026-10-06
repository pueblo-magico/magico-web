import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { D1RepositorioDisponibilidad } from '../../functions/_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { onRequestGet as listarAlojamientos } from '../../functions/api/v1/public/alojamientos.ts';
import { onRequestGet as consultarDisponibilidad } from '../../functions/api/v1/public/disponibilidad.ts';
import { onRequestPost as crearCotizacion } from '../../functions/api/v1/public/cotizaciones.ts';

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

  return {
    sqlite,
    db: { prepare(query: string) { return new Statement(query); } },
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
  assert.ok(Number.isInteger(body.data.precio.subtotal_centavos));
  assert.ok(Number.isInteger(body.data.precio.sena_centavos));
  assert.equal(body.data.precio.desglose_noches.length, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM cotizaciones').get()?.cantidad, 1);
  sqlite.close();
});
