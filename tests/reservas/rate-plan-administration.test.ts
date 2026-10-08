import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { crearBorradorTarifa, publicarPlanTarifa } from '../../functions/_application/reservas/gestionarPlanTarifa.ts';
import type { PlanTarifaBorrador } from '../../functions/_domain/reservas/ratePlanAdministration.ts';
import { D1RegistroAuditoriaReservas } from '../../functions/_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioAdministracionTarifas } from '../../functions/_infrastructure/d1/D1RepositorioAdministracionTarifas.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import { onRequestGet as listarTarifas, onRequestPost as gestionarTarifas } from '../../functions/api/admin/tarifas.ts';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const nombre of readdirSync(new URL('../../migrations', import.meta.url)).filter(n => /^\d{4}_.+\.sql$/.test(n)).sort()) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${nombre}`, import.meta.url), 'utf8'));
  }

  class Statement {
    values: unknown[] = [];
    readonly query: string;
    constructor(query: string) { this.query = query; }
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
        const results = statements.map(statement => ({
          success: true,
          results: sqlite.prepare(statement.query).all(...statement.values as any[]) as Record<string, unknown>[],
        }));
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { sqlite, db };
}

const borrador: PlanTarifaBorrador = {
  codigo: 'alojamiento-base', nombre: 'Tarifa 2027', moneda: 'ARS',
  temporadas: [{
    codigo: 'base-2027', nombre: 'Base 2027', fechaDesde: '2027-01-01', fechaHasta: '2027-12-31', prioridad: 0,
    reglas: [
      { tipoAlojamiento: 'domo', modalidad: 'cualquiera', ocupacionMin: 1, ocupacionMax: 2,
        baseCalculo: 'unidad_noche', importeCentavos: 9_000_000 },
      { tipoAlojamiento: 'domo', modalidad: 'cualquiera', ocupacionMin: 3, ocupacionMax: 7,
        baseCalculo: 'persona_noche', importeCentavos: 6_000_000 },
    ],
  }],
  senas: [{ subtotalDesdeCentavos: 0, subtotalHastaCentavos: null, tipo: 'porcentaje_bps', valor: 3000 }],
};

test('crea, publica y audita una nueva versión retirando la anterior atómicamente', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioAdministracionTarifas(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);

  const creado = await crearBorradorTarifa(borrador, 'admin@test', repositorio, auditoria);
  assert.equal(creado.version, 2);
  assert.equal(creado.estado, 'borrador');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reglas_precio WHERE temporada_id IN (SELECT id FROM temporadas WHERE plan_tarifa_id = ?)').get(creado.id)?.n, 2);

  const publicado = await publicarPlanTarifa(creado.id, 'admin@test', repositorio, auditoria);
  assert.equal(publicado.estado, 'publicado');
  assert.deepEqual(
    sqlite.prepare("SELECT version, estado FROM planes_tarifa WHERE codigo = 'alojamiento-base' ORDER BY version").all().map(row => ({ ...row })),
    [{ version: 1, estado: 'retirado' }, { version: 2, estado: 'publicado' }]
  );
  assert.deepEqual(
    sqlite.prepare("SELECT accion FROM auditoria_admin WHERE entidad_tipo = 'plan_tarifa' ORDER BY id").all().map(row => row.accion),
    ['crear_borrador_tarifa', 'publicar_plan_tarifa']
  );
  assert.equal((await repositorio.listar()).length, 2);
  sqlite.close();
});

test('rechaza reglas ambiguas antes de escribir y no publica dos veces', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioAdministracionTarifas(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const ambiguo: PlanTarifaBorrador = {
    ...borrador,
    temporadas: [{ ...borrador.temporadas[0], reglas: [
      borrador.temporadas[0].reglas[0],
      { ...borrador.temporadas[0].reglas[0], ocupacionMin: 2, ocupacionMax: 3 },
    ] }],
  };
  await assert.rejects(() => crearBorradorTarifa(ambiguo, 'admin@test', repositorio, auditoria), /ambiguas/);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM planes_tarifa WHERE version = 2").get()?.n, 0);

  const creado = await crearBorradorTarifa(borrador, 'admin@test', repositorio, auditoria);
  await publicarPlanTarifa(creado.id, 'admin@test', repositorio, auditoria);
  await assert.rejects(() => publicarPlanTarifa(creado.id, 'admin@test', repositorio, auditoria), /borrador/);

  const temporadasAmbiguas: PlanTarifaBorrador = {
    ...borrador, codigo: 'plan-ambiguo',
    temporadas: [borrador.temporadas[0], {
      ...borrador.temporadas[0], codigo: 'otra', fechaDesde: '2027-06-01', fechaHasta: '2027-08-01',
    }],
  };
  await assert.rejects(() => crearBorradorTarifa(temporadasAmbiguas, 'admin@test', repositorio, auditoria), /temporadas ambiguas/);
  sqlite.close();
});

test('rechaza valores de contrato que D1 no debe interpretar como reglas comerciales', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioAdministracionTarifas(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const casos: PlanTarifaBorrador[] = [
    { ...borrador, temporadas: [{ ...borrador.temporadas[0], fechaDesde: '2027-02-30' }] },
    { ...borrador, temporadas: [{ ...borrador.temporadas[0], reglas: [
      { ...borrador.temporadas[0].reglas[0], baseCalculo: 'por_huesped' as any },
    ] }] },
    { ...borrador, temporadas: [{ ...borrador.temporadas[0], reglas: [
      { ...borrador.temporadas[0].reglas[0], exclusividadDesde: 4, exclusividadHasta: null },
    ] }] },
    { ...borrador, senas: [{ ...borrador.senas[0], tipo: 'texto' as any }] },
  ];

  for (const caso of casos) {
    await assert.rejects(() => crearBorradorTarifa(caso, 'admin@test', repositorio, auditoria), /inválid/);
  }
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM planes_tarifa WHERE version = 2").get()?.n, 0);
  sqlite.close();
});

test('el contrato administrativo exige sesión, CSRF y permiso para crear borradores', async () => {
  const { sqlite, db } = database();
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('admin@test', 'x', 'super_admin')");
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-tarifas';
  const token = await createSessionToken('admin@test', secret, csrf);
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
    Cookie: `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`,
  };
  const request = new Request('https://test/api/admin/tarifas', {
    method: 'POST', headers,
    body: JSON.stringify({
      accion: 'crear_borrador',
      plan: {
        codigo: borrador.codigo, nombre: borrador.nombre, moneda: borrador.moneda,
        temporadas: borrador.temporadas.map(temporada => ({
          codigo: temporada.codigo, nombre: temporada.nombre,
          fecha_desde: temporada.fechaDesde, fecha_hasta: temporada.fechaHasta,
          prioridad: temporada.prioridad,
          reglas: temporada.reglas.map(regla => ({
            tipo_alojamiento: regla.tipoAlojamiento, modalidad: regla.modalidad,
            ocupacion_min: regla.ocupacionMin, ocupacion_max: regla.ocupacionMax,
            base_calculo: regla.baseCalculo, importe_centavos: regla.importeCentavos,
          })),
        })),
        senas: borrador.senas.map(sena => ({
          subtotal_desde_centavos: sena.subtotalDesdeCentavos,
          subtotal_hasta_centavos: sena.subtotalHastaCentavos,
          tipo: sena.tipo, valor: sena.valor,
        })),
      },
    }),
  });
  const env = { DB: db, SESSION_SECRET: secret };
  const creada = await gestionarTarifas({ request, env });
  assert.equal(creada.status, 201);
  assert.equal((await creada.json() as any).plan.version, 2);

  const listada = await listarTarifas({
    request: new Request('https://test/api/admin/tarifas', { headers: { Cookie: headers.Cookie } }), env,
  });
  assert.equal(listada.status, 200);
  assert.equal((await listada.json() as any).planes.length, 2);
  sqlite.close();
});
