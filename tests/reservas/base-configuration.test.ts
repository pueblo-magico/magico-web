import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';

import { crearReservaPublica } from '../../functions/_application/reservas/crearReservaPublica.ts';
import {
  actualizarServicioAlojamientoConfiguracion,
  actualizarModalidadConfiguracion,
  actualizarEspacioConfiguracion,
  actualizarHorariosComidasConfiguracion,
  actualizarParametroConfiguracion,
  crearServicioAlojamientoConfiguracion,
  publicarTarifaAlimentacionConfiguracion,
} from '../../functions/_application/reservas/gestionarConfiguracionBase.ts';
import {
  normalizarPaymentHoldMinutes,
  validarCambioModalidadComercial,
  validarCambioHorariosComidas,
  validarCambioParametroOperativo,
  validarNuevoServicioAlojamiento,
  validarCambioOpcionPreparacionEstadia,
  validarCambioTarifaAlimentacion,
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
          results: /RETURNING\s/i.test(statement.query)
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
  assert.throws(() => validarCambioModalidadComercial({
    id: 0, modalidad: 'privada', contexto: 'general', unidadVenta: 'espacio',
    habilitada: true, expectedUpdatedAt: '2026-01-01T00:00:00Z', motivo: 'Cambio aprobado',
  }), /modalidad comercial es inválida/);
  assert.throws(() => validarCambioModalidadComercial({
    id: 1, modalidad: 'privada', contexto: 'general', unidadVenta: 'espacio',
    habilitada: true, nombreComercial: 'Privada', descripcionComercial: 'x'.repeat(301),
    expectedUpdatedAt: '2026-01-01T00:00:00Z', motivo: 'Cambio aprobado',
  }), /300 caracteres/);
  assert.throws(() => validarCambioTarifaAlimentacion({
    codigo: 'pension_completa', precioComidaCentavos: -1, expectedVersion: 1, motivo: 'Cambio aprobado',
  }), /tarifa de alimentación es inválida/);
  assert.throws(() => validarNuevoServicioAlojamiento({
    tipoAlojamiento: 'domo', codigo: 'x', nombre: 'Electricidad',
    disponibilidad: 'no_disponible', detalle: '', visibleEnReserva: true,
    orden: 10, motivo: 'Cambio aprobado',
  }), /código del servicio es inválido/);
  const servicioValido = {
    tipoAlojamiento: 'domo' as const, codigo: 'electricidad-domo', nombre: 'Electricidad',
    disponibilidad: 'no_disponible' as const, detalle: '', visibleEnReserva: true,
    orden: 10, motivo: 'Cambio aprobado',
  };
  assert.equal(validarNuevoServicioAlojamiento(servicioValido).nombre, 'Electricidad');
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, tipoAlojamiento: 'salon' as any }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, disponibilidad: 'desconocido' as any }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, visibleEnReserva: 'sí' as any }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, orden: 1_000 }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, nombre: ' ' }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarNuevoServicioAlojamiento({ ...servicioValido, detalle: 'x'.repeat(241) }), /servicio del alojamiento es inválido/);
  assert.throws(() => validarCambioOpcionPreparacionEstadia({
    id: 1, tipoAlojamiento: 'domo', modalidad: 'privada', cantidadPersonas: 0,
    nombre: 'Cama doble', descripcion: '', habilitada: true, orden: 10,
    expectedUpdatedAt: '2026-01-01T00:00:00Z', motivo: 'Cambio aprobado',
  }), /opción de preparación es inválida/);
});

test('lee fuentes efectivas y actualiza con versión y auditoría atómica', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioConfiguracionBaseReservas(d1(sqlite));
  const inicial = await repositorio.obtenerEfectiva();
  assert.equal(await repositorio.obtenerPaymentHoldMinutes(), 15);
  assert.equal(inicial.parametros[0].version, 1);
  assert.ok(inicial.inventario.some(item => item.codigo === 'domo-1' && item.capacidadComercial === 7));
  assert.equal(inicial.tarifa?.reglasSena, 2);
  assert.equal(inicial.tarifa?.temporadas[0]?.reglas.length, 5);
  assert.equal(inicial.tarifa?.senas.length, 2);
  assert.deepEqual(inicial.alimentacion.map(item => item.codigo), ['desayuno_incluido', 'pension_completa']);
  assert.ok(inicial.servicios.some(item => item.tipoAlojamiento === 'refugio' && item.codigo === 'wifi-satelital'));
  assert.ok(inicial.servicios.some(item => item.tipoAlojamiento === 'domo' && item.codigo === 'electricidad-alojamiento' && item.disponibilidad === 'no_disponible'));
  assert.deepEqual(inicial.opcionesPreparacion.map(item => item.codigo), ['cama_doble', 'dos_camas_simples']);
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

test('super admin crea y actualiza servicios públicos sin modificar el inventario físico', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioConfiguracionBaseReservas(d1(sqlite));
  const inventarioAntes = sqlite.prepare('SELECT COUNT(*) cantidad FROM instalaciones').get()?.cantidad;

  const creado = await crearServicioAlojamientoConfiguracion({
    tipoAlojamiento: 'bell_tent', codigo: 'ropa-blanca', nombre: 'Ropa blanca',
    disponibilidad: 'incluido', detalle: 'Sábanas y toallas incluidas.',
    visibleEnReserva: true, orden: 10, motivo: 'Publicar información confirmada',
    actorEmail: 'admin@test', correlationId: 'req-service-1',
  }, repositorio, () => 'op-service-1');
  assert.equal(creado.codigo, 'ropa-blanca');
  assert.equal(creado.tipoAlojamiento, 'bell_tent');

  const actualizado = await actualizarServicioAlojamientoConfiguracion({
    id: creado.id, tipoAlojamiento: creado.tipoAlojamiento, nombre: creado.nombre,
    disponibilidad: 'no_disponible', detalle: 'No se entrega ropa blanca.',
    visibleEnReserva: true, orden: 20, expectedUpdatedAt: creado.actualizadoAt,
    motivo: 'Corregir condición comercial', actorEmail: 'admin@test',
    correlationId: 'req-service-2',
  }, repositorio, () => 'op-service-2');
  assert.equal(actualizado.disponibilidad, 'no_disponible');
  assert.equal(actualizado.detalle, 'No se entrega ropa blanca.');
  await assert.rejects(crearServicioAlojamientoConfiguracion({
    tipoAlojamiento: 'bell_tent', codigo: 'ropa-blanca', nombre: 'Ropa blanca',
    disponibilidad: 'incluido', detalle: '', visibleEnReserva: true, orden: 10,
    motivo: 'Evitar servicio duplicado', actorEmail: 'admin@test', correlationId: 'req-service-3',
  }, repositorio, () => 'op-service-3'), /servicio ya existe/);
  await assert.rejects(actualizarServicioAlojamientoConfiguracion({
    id: creado.id, tipoAlojamiento: creado.tipoAlojamiento, nombre: creado.nombre,
    disponibilidad: 'incluido', detalle: '', visibleEnReserva: true, orden: 10,
    expectedUpdatedAt: '2020-01-01T00:00:00.000Z', motivo: 'Evitar edición desactualizada',
    actorEmail: 'admin@test', correlationId: 'req-service-4',
  }, repositorio, () => 'op-service-4'), /servicio cambió/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) cantidad FROM instalaciones').get()?.cantidad, inventarioAntes);
  assert.deepEqual(
    sqlite.prepare("SELECT accion FROM auditoria_admin WHERE entidad_tipo = 'servicio_alojamiento' ORDER BY id").all().map(row => row.accion),
    ['crear_servicio_alojamiento', 'actualizar_servicio_alojamiento'],
  );
  sqlite.close();
});

test('super admin puede cambiar modalidades y publicar una nueva tarifa de alimentación con auditoría', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioConfiguracionBaseReservas(d1(sqlite));
  const inicial = await repositorio.obtenerEfectiva();
  const modalidad = inicial.inventario.flatMap(item => item.modalidades)
    .find(item => item.modalidad === 'privada' && item.contexto === 'general');
  assert.ok(modalidad);

  const actualizada = await actualizarModalidadConfiguracion({
    id: modalidad.id, modalidad: modalidad.modalidad as 'privada', contexto: modalidad.contexto as 'general',
    unidadVenta: modalidad.unidadVenta as 'espacio', habilitada: !modalidad.habilitada,
    nombreComercial: modalidad.nombreComercial,
    descripcionComercial: 'Uso exclusivo con ropa blanca incluida.',
    expectedUpdatedAt: modalidad.actualizadoAt,
    motivo: 'Cambio comercial aprobado', actorEmail: 'admin@test', correlationId: 'req-modalidad-1',
  }, repositorio, () => 'op-modalidad-1');
  assert.equal(actualizada.habilitada, !modalidad.habilitada);
  assert.equal(actualizada.descripcionComercial, 'Uso exclusivo con ropa blanca incluida.');
  assert.equal(
    sqlite.prepare('SELECT descripcion_comercial FROM modalidades_espacio WHERE id = ?').get(modalidad.id)?.descripcion_comercial,
    'Uso exclusivo con ropa blanca incluida.',
  );
  await assert.rejects(actualizarModalidadConfiguracion({
    id: modalidad.id, modalidad: modalidad.modalidad as 'privada', contexto: modalidad.contexto as 'general',
    unidadVenta: modalidad.unidadVenta as 'espacio', habilitada: modalidad.habilitada,
    expectedUpdatedAt: modalidad.actualizadoAt,
    motivo: 'Vista desactualizada', actorEmail: 'admin@test', correlationId: 'req-modalidad-2',
  }, repositorio), /modalidad cambió/);

  const camping = inicial.inventario.find(item => item.codigo === 'camping-exterior');
  assert.ok(camping);
  const campingActualizado = await actualizarEspacioConfiguracion({
    codigo: camping.codigo, capacidadComercial: 12, capacidadOperativaMaxima: 16,
    reservableGeneral: true, reservableRetiro: true, estado: 'activo',
    expectedUpdatedAt: camping.actualizadoAt, motivo: 'Habilitar venta de camping',
    actorEmail: 'admin@test', correlationId: 'req-camping-1',
  }, repositorio, () => 'op-camping-1');
  assert.equal(campingActualizado.estado, 'activo');
  assert.equal(campingActualizado.capacidadComercial, 12);

  const pension = inicial.alimentacion.find(item => item.codigo === 'pension_completa');
  assert.ok(pension);
  const publicada = await publicarTarifaAlimentacionConfiguracion({
    codigo: pension.codigo, precioComidaCentavos: 2_500_000, expectedVersion: pension.version,
    motivo: 'Nuevo precio comercial', actorEmail: 'admin@test', correlationId: 'req-food-1',
  }, repositorio, () => 'op-food-1');
  assert.equal(publicada.version, pension.version + 1);
  assert.equal(publicada.precioComidaCentavos, 2_500_000);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM tarifas_alimentacion WHERE codigo = 'pension_completa' AND estado = 'publicado'").get()?.n, 1);
  assert.deepEqual(
    sqlite.prepare("SELECT accion FROM auditoria_admin WHERE accion IN ('actualizar_modalidad_comercial', 'publicar_tarifa_alimentacion') ORDER BY id").all().map(row => row.accion),
    ['actualizar_modalidad_comercial', 'publicar_tarifa_alimentacion']
  );
  sqlite.close();
});

test('super admin actualiza los horarios de comidas con versión y auditoría', async () => {
  const sqlite = baseCompleta();
  const repositorio = new D1RepositorioConfiguracionBaseReservas(d1(sqlite));
  const inicial = await repositorio.obtenerEfectiva();
  assert.deepEqual(inicial.horariosComidas.desayuno, { desde: '09:00', hasta: '10:00' });

  const actualizados = await actualizarHorariosComidasConfiguracion({
    desayuno: { desde: '08:30', hasta: '10:00' },
    almuerzo: { desde: '13:30', hasta: '15:00' },
    cena: { desde: '19:30', hasta: '21:00' },
    expectedVersion: inicial.horariosComidas.version,
    motivo: 'Ajustar horarios de cocina', actorEmail: 'admin@test', correlationId: 'req-meal-hours-1',
  }, repositorio, () => 'op-meal-hours-1');

  assert.equal(actualizados.version, inicial.horariosComidas.version + 1);
  assert.deepEqual(actualizados.cena, { desde: '19:30', hasta: '21:00' });
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) cantidad FROM auditoria_admin WHERE accion = 'actualizar_horarios_comidas'").get()?.cantidad,
    1,
  );
  assert.equal(await repositorio.actualizarHorariosComidas({
    desayuno: actualizados.desayuno, almuerzo: actualizados.almuerzo, cena: actualizados.cena,
    expectedVersion: inicial.horariosComidas.version,
    motivo: 'Comprobar conflicto de versión', actorEmail: 'admin@test', correlationId: 'req-meal-hours-stale',
  }), null);
  await assert.rejects(actualizarHorariosComidasConfiguracion({
    desayuno: { desde: '10:00', hasta: '09:00' },
    almuerzo: actualizados.almuerzo, cena: actualizados.cena,
    expectedVersion: actualizados.version,
    motivo: 'Horario inválido para validar', actorEmail: 'admin@test', correlationId: 'req-meal-hours-2',
  }, repositorio), /horarios de comidas son inválidos/);
  assert.throws(() => validarCambioHorariosComidas({
    desayuno: { desde: '25:00', hasta: '26:00' },
    almuerzo: actualizados.almuerzo, cena: actualizados.cena,
    expectedVersion: actualizados.version, motivo: 'Validar formato horario',
  }), /horarios de comidas son inválidos/);
  assert.throws(() => validarCambioHorariosComidas({
    desayuno: actualizados.desayuno, almuerzo: actualizados.almuerzo, cena: actualizados.cena,
    expectedVersion: 0, motivo: 'Validar versión inválida',
  }), /horarios de comidas son inválidos/);
  assert.throws(() => validarCambioHorariosComidas({
    desayuno: actualizados.desayuno, almuerzo: actualizados.almuerzo, cena: actualizados.cena,
    expectedVersion: actualizados.version, motivo: 'no',
  }), /motivo debe tener entre 5 y 500 caracteres/);
  sqlite.close();
});

test('la creación pública usa el plazo efectivo y conserva el vencimiento calculado', async () => {
  let holdExpiresAt = '';
  const resultado = await crearReservaPublica({
    cotizacionCodigo: 'COT-CONFIG-1', espacioCodigo: 'domo-1', clienteNombre: 'QA Config',
    clienteTelefono: null, clienteEmail: 'config@example.test', idempotencyKey: 'config-hold-0001',
  }, {
    async buscarIdempotencia() { return null; },
    async buscarConsultaIntegracion() { return null; },
    async listarOpcionesPreparacionAplicables() { return []; },
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

  const requestAccion = (body: Record<string, unknown>) => new Request('https://test/api/v1/admin/configuracion-reservas', {
    method: 'PATCH', headers: { Cookie: cookie(tokenAdmin), 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const campingEspacio = sqlite.prepare(`SELECT codigo, updated_at FROM espacios WHERE codigo = 'camping-exterior'`).get() as Record<string, unknown>;
  const espacioResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'actualizar_espacio', codigo: String(campingEspacio.codigo), capacidad_comercial: 8,
    capacidad_operativa_maxima: 12, reservable_general: true, reservable_retiro: true,
    estado: 'activo', expected_updated_at: String(campingEspacio.updated_at),
    motivo: 'Habilitar camping desde contrato',
  }), env });
  assert.equal(espacioResponse.status, 200);
  assert.equal((await espacioResponse.json() as any).data.estado, 'activo');

  const modalidad = sqlite.prepare(`SELECT id, modalidad, contexto, unidad_venta, habilitada, updated_at FROM modalidades_espacio
    WHERE contexto = 'general' ORDER BY id LIMIT 1`).get() as Record<string, unknown>;
  const modalidadResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'actualizar_modalidad', id: Number(modalidad.id),
    modalidad: String(modalidad.modalidad), contexto: String(modalidad.contexto),
    unidad_venta: String(modalidad.unidad_venta),
    habilitada: Number(modalidad.habilitada) !== 1,
    expected_updated_at: String(modalidad.updated_at),
    motivo: 'Cambio comercial desde contrato',
  }), env });
  assert.equal(modalidadResponse.status, 200);

  const tarifa = sqlite.prepare("SELECT version FROM tarifas_alimentacion WHERE codigo = 'pension_completa' AND estado = 'publicado'").get() as Record<string, unknown>;
  const alimentacionResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'publicar_tarifa_alimentacion', codigo: 'pension_completa',
    precio_comida_centavos: 2_600_000, expected_version: Number(tarifa.version),
    motivo: 'Cambio comercial desde contrato',
  }), env });
  assert.equal(alimentacionResponse.status, 200);
  assert.equal((await alimentacionResponse.json() as any).data.precioComidaCentavos, 2_600_000);

  const horarios = sqlite.prepare('SELECT version FROM configuracion_horarios_comidas WHERE id = 1').get() as Record<string, unknown>;
  const horariosResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'actualizar_horarios_comidas',
    desayuno_desde: '08:30', desayuno_hasta: '10:00',
    almuerzo_desde: '13:30', almuerzo_hasta: '15:00',
    cena_desde: '19:30', cena_hasta: '21:00',
    expected_version: Number(horarios.version), motivo: 'Cambiar horarios desde contrato',
  }), env });
  assert.equal(horariosResponse.status, 200);
  assert.deepEqual((await horariosResponse.json() as any).data.almuerzo, { desde: '13:30', hasta: '15:00' });

  const servicioResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'crear_servicio_alojamiento', tipo_alojamiento: 'refugio', codigo: 'estufa-lena',
    nombre: 'Estufa a leña', disponibilidad: 'incluido', detalle: 'Disponible en el espacio común.',
    visible_en_reserva: true, orden: 60, motivo: 'Publicar servicio confirmado',
  }), env });
  assert.equal(servicioResponse.status, 201);
  const servicioCreado = (await servicioResponse.json() as any).data;
  assert.equal(servicioCreado.codigo, 'estufa-lena');

  const servicioActualizadoResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'actualizar_servicio_alojamiento', id: servicioCreado.id,
    tipo_alojamiento: 'refugio', nombre: 'Estufa a leña', disponibilidad: 'no_disponible',
    detalle: 'No disponible temporalmente.', visible_en_reserva: false, orden: 70,
    expected_updated_at: servicioCreado.actualizadoAt, motivo: 'Actualizar servicio confirmado',
  }), env });
  assert.equal(servicioActualizadoResponse.status, 200);
  const servicioActualizado = (await servicioActualizadoResponse.json() as any).data;
  assert.equal(servicioActualizado.disponibilidad, 'no_disponible');
  assert.equal(servicioActualizado.visibleEnReserva, false);

  const servicioInvalidoResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'crear_servicio_alojamiento', motivo: 'Solicitud inválida controlada',
  }), env });
  assert.equal(servicioInvalidoResponse.status, 400);
  const opcionPreparacion = sqlite.prepare("SELECT * FROM opciones_preparacion_estadia WHERE codigo = 'cama_doble'").get() as Record<string, unknown>;
  const opcionResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'actualizar_opcion_preparacion', id: Number(opcionPreparacion.id),
    tipo_alojamiento: 'domo', modalidad: 'privada', cantidad_personas: 2,
    nombre: 'Una cama matrimonial', descripcion: 'Preparación confirmada por administración.',
    habilitada: true, orden: 5, expected_updated_at: String(opcionPreparacion.updated_at),
    motivo: 'Actualizar preparación de camas',
  }), env });
  assert.equal(opcionResponse.status, 200);
  const opcionActualizada = (await opcionResponse.json() as any).data;
  assert.equal(opcionActualizada.nombre, 'Una cama matrimonial');
  assert.equal(sqlite.prepare("SELECT accion FROM auditoria_admin WHERE entidad_tipo = 'opcion_preparacion_estadia'").get()?.accion, 'actualizar_opcion_preparacion');
  const accionInvalidaResponse = await actualizarConfiguracion({ request: requestAccion({
    accion: 'accion_inexistente', motivo: 'Solicitud inválida controlada',
  }), env });
  assert.equal(accionInvalidaResponse.status, 400);
  sqlite.close();
});
