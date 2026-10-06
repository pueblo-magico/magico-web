import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  cancelarOcupacionOperativa,
  crearBloqueoInventario,
  crearEstadiaNoComercial,
} from '../../functions/_application/reservas/gestionarOcupacionOperativa.ts';
import { validarNuevoBloqueo } from '../../functions/_domain/reservas/operationalOccupancy.ts';
import { D1RegistroAuditoriaReservas } from '../../functions/_infrastructure/d1/D1RegistroAuditoriaReservas.ts';
import { D1RepositorioOcupacionOperativa } from '../../functions/_infrastructure/d1/D1RepositorioOcupacionOperativa.ts';
import { D1RepositorioDisponibilidad } from '../../functions/_infrastructure/d1/D1RepositorioDisponibilidad.ts';
import { D1RepositorioCalendarioDisponibilidad } from '../../functions/_infrastructure/d1/D1RepositorioCalendarioDisponibilidad.ts';
import { createSessionToken } from '../../functions/_lib/session.ts';
import { onRequestGet as listarOcupacion, onRequestPost as gestionarOcupacion } from '../../functions/api/admin/ocupacion-operativa.ts';

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
  return { sqlite, db: { prepare(query: string) { return new Statement(query); } } };
}

test('valida objetivo exclusivo, fechas reales y motivo antes de consultar D1', () => {
  assert.throws(() => validarNuevoBloqueo({
    espacioId: 1, unidadInventarioId: 2, fechaDesde: '2027-01-01', fechaHasta: '2027-01-02',
    tipo: 'mantenimiento', motivo: 'Reparación',
  }), /exactamente un espacio/);
  assert.throws(() => validarNuevoBloqueo({
    espacioId: 1, unidadInventarioId: null, fechaDesde: '2027-02-30', fechaHasta: '2027-03-02',
    tipo: 'mantenimiento', motivo: 'Reparación',
  }), /rango de noches/);
});

test('crea y cancela un bloqueo sin borrarlo y deja auditoría', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioOcupacionOperativa(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const espacioId = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-1'").get()?.id);

  const creado = await crearBloqueoInventario({
    espacioId, unidadInventarioId: null, fechaDesde: '2027-01-10', fechaHasta: '2027-01-12',
    tipo: 'mantenimiento', motivo: 'Reparación de lona',
  }, 'admin@test', repositorio, auditoria);
  assert.equal(creado.estado, 'activo');
  assert.match(creado.codigo, /^BLQ-/);
  assert.equal((await repositorio.listar()).length, 1);

  const cancelado = await cancelarOcupacionOperativa('bloqueo', creado.id, 'admin@test', repositorio, auditoria);
  assert.equal(cancelado.estado, 'cancelado');
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM bloqueos_inventario').get()?.n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ocupacion_operativa').get()?.n, 0);
  assert.deepEqual(
    sqlite.prepare("SELECT accion FROM auditoria_admin WHERE entidad_tipo = 'bloqueo_inventario' ORDER BY id").all().map(r => r.accion),
    ['crear_bloqueo_inventario', 'cancelar_bloqueo_inventario']
  );
  sqlite.close();
});

test('rechaza conflicto con reserva activa pero respeta el checkout exclusivo', async () => {
  const { sqlite, db } = database();
  sqlite.exec(`
    INSERT INTO reservas (
      cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout,
      cantidad_personas, monto_total, estado, canal_origen
    ) VALUES ('QA', 1, '2027-02-01', '2027-02-03', 2, 0, 'confirmada', 'QA');
  `);
  const espacioId = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-1'").get()?.id);
  const repositorio = new D1RepositorioOcupacionOperativa(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  await assert.rejects(() => crearBloqueoInventario({
    espacioId, unidadInventarioId: null, fechaDesde: '2027-02-02', fechaHasta: '2027-02-04',
    tipo: 'cierre', motivo: 'Cierre operativo',
  }, 'admin@test', repositorio, auditoria), /inventario ya está ocupado/);

  const posterior = await crearBloqueoInventario({
    espacioId, unidadInventarioId: null, fechaDesde: '2027-02-03', fechaHasta: '2027-02-04',
    tipo: 'cierre', motivo: 'Cierre posterior',
  }, 'admin@test', repositorio, auditoria);
  assert.equal(posterior.estado, 'activo');
  sqlite.close();
});

test('registra estadía no comercial sin crear reserva ni pago ficticio', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioOcupacionOperativa(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const espacioId = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-2'").get()?.id);
  const reservasAntes = Number(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n);

  const creada = await crearEstadiaNoComercial({
    espacioId, unidadInventarioId: null, fechaCheckin: '2027-03-01', fechaCheckout: '2027-03-04',
    tipo: 'voluntario', referenciaOperativa: 'Equipo vivero', cantidadPersonas: 2,
  }, 'admin@test', repositorio, auditoria);
  assert.equal(creada.clase, 'estadia_no_comercial');
  assert.equal(creada.cantidadPersonas, 2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM reservas').get()?.n, reservasAntes);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM pagos').get()?.n, 0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM ocupacion_operativa').get()?.n, 1);
  sqlite.close();
});

test('impide superponer mantenimiento con estadías internas y valida capacidad física', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioOcupacionOperativa(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const espacioId = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-1'").get()?.id);
  const unidadId = Number(sqlite.prepare("SELECT id FROM unidades_inventario WHERE espacio_id = ? ORDER BY id LIMIT 1").get(espacioId)?.id);
  await crearEstadiaNoComercial({
    espacioId, unidadInventarioId: null, fechaCheckin: '2027-03-10', fechaCheckout: '2027-03-12',
    tipo: 'staff', referenciaOperativa: 'Equipo operativo', cantidadPersonas: 2,
  }, 'admin@test', repositorio, auditoria);
  await assert.rejects(() => crearBloqueoInventario({
    espacioId: null, unidadInventarioId: unidadId, fechaDesde: '2027-03-11', fechaHasta: '2027-03-13',
    tipo: 'mantenimiento', motivo: 'Reparación puntual',
  }, 'admin@test', repositorio, auditoria), /inventario ya está ocupado/);

  await assert.rejects(() => crearEstadiaNoComercial({
    espacioId: null, unidadInventarioId: unidadId, fechaCheckin: '2027-04-01', fechaCheckout: '2027-04-02',
    tipo: 'staff', referenciaOperativa: 'Equipo operativo', cantidadPersonas: 2,
  }, 'admin@test', repositorio, auditoria), /supera la capacidad/);
  sqlite.close();
});

test('bloqueos y estadías internas afectan la disponibilidad pública y el calendario', async () => {
  const { sqlite, db } = database();
  const repositorio = new D1RepositorioOcupacionOperativa(db);
  const auditoria = new D1RegistroAuditoriaReservas(db);
  const domo1 = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-1'").get()?.id);
  const domo2 = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-2'").get()?.id);
  const refugio = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'refugio'").get()?.id);
  const rango = { fechaDesde: '2027-04-10', fechaHasta: '2027-04-12' };

  await crearBloqueoInventario({
    espacioId: domo1, unidadInventarioId: null, ...rango, tipo: 'mantenimiento', motivo: 'Lona',
  }, 'admin@test', repositorio, auditoria);
  const disponibilidad = new D1RepositorioDisponibilidad(db);
  assert.deepEqual(await disponibilidad.consultar({
    tipo: 'domo', personas: 2, fechaEntrada: rango.fechaDesde, fechaSalida: rango.fechaHasta,
  }), { estado: 'disponible', alojamiento_id: 2 });

  await crearBloqueoInventario({
    espacioId: domo2, unidadInventarioId: null, ...rango, tipo: 'cierre', motivo: 'Cierre',
  }, 'admin@test', repositorio, auditoria);
  assert.deepEqual(await disponibilidad.consultar({
    tipo: 'domo', personas: 2, fechaEntrada: rango.fechaDesde, fechaSalida: rango.fechaHasta,
  }), { estado: 'ocupado', alojamiento_id: null });

  await crearEstadiaNoComercial({
    espacioId: refugio, unidadInventarioId: null, fechaCheckin: rango.fechaDesde, fechaCheckout: rango.fechaHasta,
    tipo: 'staff', referenciaOperativa: 'Equipo cocina', cantidadPersonas: 4,
  }, 'admin@test', repositorio, auditoria);
  assert.equal((await disponibilidad.consultar({
    tipo: 'refugio', personas: 12, fechaEntrada: rango.fechaDesde, fechaSalida: rango.fechaHasta,
  })).estado, 'ocupado');
  assert.equal((await disponibilidad.consultar({
    tipo: 'refugio', personas: 11, fechaEntrada: rango.fechaDesde, fechaSalida: rango.fechaHasta,
  })).estado, 'disponible');

  const calendario = await new D1RepositorioCalendarioDisponibilidad(db)
    .listarReservasActivas(rango.fechaDesde, rango.fechaHasta);
  assert.equal(calendario.length, 3);
  assert.deepEqual(calendario.map(item => item.alojamiento_id).sort(), [1, 2, 3]);
  sqlite.close();
});

test('el contrato administrativo crea, lista y cancela con sesión, CSRF y permiso', async () => {
  const { sqlite, db } = database();
  sqlite.exec("INSERT INTO usuarios_admin (email, password_hash, rol) VALUES ('editor@test', 'x', 'editor')");
  const secret = 'session-secret-seguro-de-al-menos-32-caracteres';
  const csrf = 'csrf-ocupacion-operativa';
  const token = await createSessionToken('editor@test', secret, csrf);
  const cookie = `pm_admin_session=${encodeURIComponent(token)}; pm_admin_csrf=${csrf}`;
  const espacioId = Number(sqlite.prepare("SELECT id FROM espacios WHERE codigo = 'domo-1'").get()?.id);
  const env = { DB: db, SESSION_SECRET: secret };

  const creada = await gestionarOcupacion({
    request: new Request('https://test/api/admin/ocupacion-operativa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Cookie: cookie },
      body: JSON.stringify({
        accion: 'crear_bloqueo', espacio_id: espacioId,
        fecha_desde: '2027-05-01', fecha_hasta: '2027-05-03',
        tipo: 'mantenimiento', motivo: 'Mantenimiento preventivo',
      }),
    }), env,
  });
  assert.equal(creada.status, 201);
  const creado = await creada.json() as any;
  assert.equal(creado.registro.estado, 'activo');

  const listada = await listarOcupacion({
    request: new Request('https://test/api/admin/ocupacion-operativa', { headers: { Cookie: cookie } }), env,
  });
  assert.equal(listada.status, 200);
  const listado = await listada.json() as any;
  assert.equal(listado.registros.length, 1);
  assert.ok(listado.espacios.some((item: any) => item.codigo === 'domo-1'));
  assert.ok(listado.unidades.some((item: any) => item.espacioId === espacioId));

  const cancelada = await gestionarOcupacion({
    request: new Request('https://test/api/admin/ocupacion-operativa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf, Cookie: cookie },
      body: JSON.stringify({ accion: 'cancelar_bloqueo', id: creado.registro.id }),
    }), env,
  });
  assert.equal(cancelada.status, 200);
  assert.equal((await cancelada.json() as any).registro.estado, 'cancelado');
  sqlite.close();
});
