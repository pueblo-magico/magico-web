import type { RepositorioGestionReservasAdmin } from '../../_application/reservas/ports.ts';
import type {
  CambiosReservaAdmin,
  DetalleReservaAdmin,
  FiltrosReservasAdmin,
  PaginaReservasAdmin,
  ResumenReservaAdmin,
} from '../../_domain/reservas/adminReservationManagement.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  run(): Promise<unknown>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

const SELECT_RESUMEN = `
  r.id, COALESCE(r.codigo, printf('RES-%08d', r.id)) codigo, r.version,
  r.cliente_nombre titular, re.fecha_checkin, re.fecha_checkout,
  re.cantidad_huespedes cantidad_personas, r.estado, r.estado_flujo,
  r.canal_origen, e.codigo espacio_codigo, e.nombre espacio_nombre,
  re.modalidad, r.updated_at
`;

const FROM_RESERVA = `
  FROM reservas r
  JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
  LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
  LEFT JOIN espacios e ON e.id = ree.espacio_id
`;

function mapearResumen(row: Record<string, unknown>): ResumenReservaAdmin {
  return {
    id: Number(row.id), codigo: String(row.codigo), version: Number(row.version),
    titular: String(row.titular), fechaCheckin: String(row.fecha_checkin),
    fechaCheckout: String(row.fecha_checkout), cantidadPersonas: Number(row.cantidad_personas),
    estado: String(row.estado), estadoFlujo: String(row.estado_flujo),
    canalOrigen: row.canal_origen == null ? null : String(row.canal_origen),
    espacioCodigo: row.espacio_codigo == null ? null : String(row.espacio_codigo),
    espacioNombre: row.espacio_nombre == null ? null : String(row.espacio_nombre),
    modalidad: String(row.modalidad), updatedAt: String(row.updated_at),
  };
}

function consultaFiltros(filtros: FiltrosReservasAdmin): { where: string; valores: unknown[] } {
  const condiciones: string[] = [];
  const valores: unknown[] = [];
  const agregar = (sql: string, valor: unknown) => { condiciones.push(sql); valores.push(valor); };
  if (filtros.fechaDesde) agregar('re.fecha_checkout > ?', filtros.fechaDesde);
  if (filtros.fechaHasta) agregar('re.fecha_checkin < ?', filtros.fechaHasta);
  if (filtros.estado) agregar('r.estado_flujo = ?', filtros.estado);
  if (filtros.origen) agregar('LOWER(COALESCE(r.canal_origen, \'\')) = LOWER(?)', filtros.origen);
  if (filtros.espacioCodigo) agregar('e.codigo = ?', filtros.espacioCodigo);
  if (filtros.titular) agregar('LOWER(r.cliente_nombre) LIKE LOWER(?)', `%${filtros.titular}%`);
  return { where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '', valores };
}

export class D1RepositorioGestionReservasAdmin implements RepositorioGestionReservasAdmin {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listar(filtros: FiltrosReservasAdmin): Promise<PaginaReservasAdmin> {
    const { where, valores } = consultaFiltros(filtros);
    const offset = (filtros.pagina - 1) * filtros.limite;
    const [totalRow, result] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) total ${FROM_RESERVA} ${where}`).bind(...valores).first(),
      this.db.prepare(`
        SELECT ${SELECT_RESUMEN} ${FROM_RESERVA} ${where}
        ORDER BY re.fecha_checkin DESC, r.id DESC LIMIT ? OFFSET ?
      `).bind(...valores, filtros.limite, offset).all(),
    ]);
    const total = Number(totalRow?.total) || 0;
    return {
      items: (result.results || []).map(mapearResumen),
      pagina: filtros.pagina,
      limite: filtros.limite,
      total,
      totalPaginas: Math.ceil(total / filtros.limite),
    };
  }

  async obtenerDetalle(reservaId: number): Promise<DetalleReservaAdmin | null> {
    const [row, estadias, excepciones] = await Promise.all([
      this.db.prepare(`
        SELECT ${SELECT_RESUMEN}, r.cliente_telefono, r.cliente_email,
          r.moneda, r.monto_total_centavos, r.monto_sena_centavos
        ${FROM_RESERVA} WHERE r.id = ?
      `).bind(reservaId).first(),
      this.db.prepare(`
        SELECT re.id, re.tramo, re.fecha_checkin, re.fecha_checkout,
          re.cantidad_huespedes, re.modalidad, e.codigo espacio_codigo, e.nombre espacio_nombre
        FROM reserva_estadias re
        LEFT JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
        LEFT JOIN espacios e ON e.id = ree.espacio_id
        WHERE re.reserva_id = ? ORDER BY re.tramo
      `).bind(reservaId).all(),
      this.db.prepare(`
        SELECT ec.id, ec.capacidad_autorizada, ec.motivo, ec.plan_camas,
          ec.fecha_desde, ec.fecha_hasta, ec.estado, ec.solicitada_por,
          ec.decidida_por, ec.solicitada_at, ec.decidida_at
        FROM excepciones_capacidad ec
        JOIN reserva_estadias re ON re.id = ec.reserva_estadia_id
        WHERE re.reserva_id = ? ORDER BY ec.id DESC
      `).bind(reservaId).all(),
    ]);
    if (!row) return null;
    return {
      ...mapearResumen(row),
      clienteTelefono: row.cliente_telefono == null ? null : String(row.cliente_telefono),
      clienteEmail: row.cliente_email == null ? null : String(row.cliente_email),
      moneda: String(row.moneda),
      montoTotalCentavos: Number(row.monto_total_centavos),
      montoSenaCentavos: row.monto_sena_centavos == null ? null : Number(row.monto_sena_centavos),
      estadias: estadias.results || [],
      excepciones: excepciones.results || [],
    };
  }

  async crear(entrada: Parameters<RepositorioGestionReservasAdmin['crear']>[0]): Promise<ResumenReservaAdmin> {
    const r = entrada.reserva;
    const statements = [
      this.db.prepare(`
        INSERT INTO reservas (
          cliente_nombre, cliente_telefono, cliente_email, alojamiento_id,
          fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena,
          estado, canal_origen, tipo_estadia, reserva_uid, codigo, moneda,
          monto_total_centavos, monto_sena_centavos, updated_at
        )
        SELECT ?, ?, ?, CASE
          WHEN e.codigo = 'domo-1' THEN 1 WHEN e.codigo = 'domo-2' THEN 2 ELSE 3 END,
          ?, ?, ?, ? / 100.0, CASE WHEN ? IS NULL THEN NULL ELSE ? / 100.0 END,
          'confirmada', ?, 'huesped', ?, ?, 'ARS', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        FROM espacios e
        JOIN modalidades_espacio me ON me.espacio_id = e.id
          AND me.modalidad = ? AND me.contexto = 'general' AND me.habilitada = 1
        WHERE e.codigo = ? AND e.estado = 'activo' AND e.tipo <> 'salon'
      `).bind(
        r.clienteNombre, r.clienteTelefono, r.clienteEmail,
        r.fechaCheckin, r.fechaCheckout, r.cantidadPersonas,
        r.montoTotalCentavos, r.montoSenaCentavos, r.montoSenaCentavos,
        r.canalOrigen, entrada.reservaUid, entrada.reservaCodigo,
        r.montoTotalCentavos, r.montoSenaCentavos, r.modalidad, r.espacioCodigo
      ),
      this.db.prepare(`
        UPDATE reserva_estadias SET modalidad = ?, espacio_solicitado_ref = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_id = (SELECT id FROM reservas WHERE reserva_uid = ?) AND tramo = 1
      `).bind(r.modalidad, `espacio:${r.espacioCodigo}`, entrada.reservaUid),
      this.db.prepare(`
        UPDATE reserva_estadia_espacios SET
          espacio_id = (SELECT id FROM espacios WHERE codigo = ?),
          origen = 'asignacion_admin', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = (
          SELECT re.id FROM reserva_estadias re JOIN reservas r ON r.id = re.reserva_id
          WHERE r.reserva_uid = ? AND re.tramo = 1
        )
      `).bind(r.espacioCodigo, entrada.reservaUid),
      this.db.prepare(`
        INSERT INTO ocupacion_reserva_noches (
          reserva_estadia_id, espacio_id, fecha, cantidad_huespedes, modalidad, estado
        )
        WITH RECURSIVE noches(fecha) AS (
          SELECT ? UNION ALL SELECT date(fecha, '+1 day') FROM noches WHERE date(fecha, '+1 day') < ?
        )
        SELECT re.id, e.id, noches.fecha, ?, ?, 'confirmada'
        FROM noches
        JOIN reservas r ON r.reserva_uid = ?
        JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
        JOIN espacios e ON e.codigo = ?
      `).bind(
        r.fechaCheckin, r.fechaCheckout, r.cantidadPersonas, r.modalidad,
        entrada.reservaUid, r.espacioCodigo
      ),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        ) SELECT id, 'reserva.creada_admin', 'usuario', ?, ?,
          json_object('espacio_codigo', ?, 'modalidad', ?), ?, 1, 'reserva', CAST(id AS TEXT)
        FROM reservas WHERE reserva_uid = ?
      `).bind(
        entrada.actorEmail, entrada.correlationId, r.espacioCodigo, r.modalidad,
        `admin-crear:${entrada.reservaUid}`, entrada.reservaUid
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, correlation_id, metadata_json
        ) SELECT ?, 'crear_reserva', 'usuario', 'reserva', CAST(id AS TEXT), ?,
          json_object('canal', ?, 'codigo', ?)
        FROM reservas WHERE reserva_uid = ?
      `).bind(
        entrada.actorEmail, entrada.correlationId, r.canalOrigen,
        entrada.reservaCodigo, entrada.reservaUid
      ),
    ];
    try {
      await this.db.batch(statements);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/inventario no disponible|bloqueado operativamente|FOREIGN KEY|NOT NULL/i.test(mensaje)) {
        throw new ErrorReserva('CONFLICTO_RESERVA', 'El espacio no está disponible o no admite esa modalidad.');
      }
      throw error;
    }
    const creada = await this.obtenerResumenPorUid(entrada.reservaUid);
    if (!creada) throw new ErrorReserva('DATOS_INVALIDOS', 'El espacio no existe o no admite esa modalidad.');
    return creada;
  }

  async editar(entrada: Parameters<RepositorioGestionReservasAdmin['editar']>[0]): Promise<ResumenReservaAdmin | null> {
    const columnas: Record<keyof CambiosReservaAdmin, string> = {
      clienteNombre: 'cliente_nombre', clienteTelefono: 'cliente_telefono',
      clienteEmail: 'cliente_email', canalOrigen: 'canal_origen',
    };
    const cambios = Object.entries(entrada.cambios) as Array<[keyof CambiosReservaAdmin, unknown]>;
    const nuevaVersion = entrada.expectedVersion + 1;
    const set = cambios.map(([campo]) => `${columnas[campo]} = ?`).join(', ');
    const valores = cambios.map(([, valor]) => valor);
    try {
      await this.db.batch([
        this.db.prepare(`
        INSERT INTO operaciones_reserva_admin (
          operacion_uid, reserva_id, accion, version_esperada, version_resultante,
          actor_ref, correlation_id
        ) SELECT ?, id, 'editar', ?, ?, ?, ? FROM reservas
        WHERE id = ? AND version = ?
      `).bind(
        entrada.operacionUid, entrada.expectedVersion, nuevaVersion,
        entrada.actorEmail, entrada.correlationId, entrada.reservaId, entrada.expectedVersion
      ),
        this.db.prepare(`
        UPDATE reservas SET ${set}, version = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND version = ? AND EXISTS (
          SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
        )
      `).bind(...valores, nuevaVersion, entrada.reservaId, entrada.expectedVersion, entrada.operacionUid),
        this.eventoOperacion(entrada, 'reserva.modificada_admin', nuevaVersion, cambios.map(([campo]) => campo)),
        this.auditoriaOperacion(entrada, 'editar_reserva', nuevaVersion),
      ]);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/UNIQUE constraint failed: operaciones_reserva_admin/i.test(mensaje)) return null;
      throw error;
    }
    return this.obtenerResumenOperacion(entrada.operacionUid);
  }

  async cambiarEstado(
    entrada: Parameters<RepositorioGestionReservasAdmin['cambiarEstado']>[0]
  ): Promise<ResumenReservaAdmin | null> {
    const nuevaVersion = entrada.expectedVersion + 1;
    const estado = entrada.accion === 'confirmar' ? 'confirmada' : 'cancelada';
    const estadoFlujo = entrada.accion === 'confirmar'
      ? 'confirmada' : entrada.accion === 'vencer' ? 'vencida' : 'cancelada';
    const condicion = entrada.accion === 'confirmar'
      ? "estado_flujo = 'pendiente_pago'"
      : entrada.accion === 'vencer'
        ? "estado_flujo = 'pendiente_pago'"
        : "estado_flujo IN ('pendiente_pago', 'confirmada')";
    const statements: Statement[] = [
      this.db.prepare(`
        INSERT INTO operaciones_reserva_admin (
          operacion_uid, reserva_id, accion, version_esperada, version_resultante,
          actor_ref, motivo, correlation_id
        ) SELECT ?, id, ?, ?, ?, ?, ?, ? FROM reservas
        WHERE id = ? AND version = ? AND ${condicion}
      `).bind(
        entrada.operacionUid, entrada.accion, entrada.expectedVersion, nuevaVersion,
        entrada.actorEmail, entrada.motivo, entrada.correlationId,
        entrada.reservaId, entrada.expectedVersion
      ),
      this.db.prepare(`
        UPDATE reservas SET estado = ?, estado_flujo = ?, version = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND version = ? AND EXISTS (
          SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
        )
      `).bind(
        estado, estadoFlujo, nuevaVersion, entrada.reservaId,
        entrada.expectedVersion, entrada.operacionUid
      ),
    ];
    if (entrada.accion === 'confirmar') {
      statements.push(this.db.prepare(`
        UPDATE ocupacion_reserva_noches SET estado = 'confirmada'
        WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = ?)
          AND estado = 'retenida' AND EXISTS (
            SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
          )
      `).bind(entrada.reservaId, entrada.operacionUid));
    } else {
      statements.push(
        this.db.prepare(`
          UPDATE ocupacion_reserva_noches SET estado = 'liberada'
          WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = ?)
            AND estado IN ('retenida', 'confirmada') AND EXISTS (
              SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
            )
        `).bind(entrada.reservaId, entrada.operacionUid),
        this.db.prepare(`
          UPDATE ocupacion_noches SET estado = 'liberada', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = ?)
            AND estado = 'activa' AND EXISTS (
              SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
            )
        `).bind(entrada.reservaId, entrada.operacionUid),
        this.db.prepare(`
          UPDATE asignaciones_inventario SET estado = 'liberada', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = ?)
            AND estado = 'activa' AND EXISTS (
              SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?
            )
        `).bind(entrada.reservaId, entrada.operacionUid)
      );
    }
    statements.push(
      this.eventoOperacion(entrada, 'reserva.estado_cambiado_admin', nuevaVersion, [entrada.accion]),
      this.auditoriaOperacion(entrada, `${entrada.accion}_reserva`, nuevaVersion)
    );
    try {
      await this.db.batch(statements);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      if (/transicion de reserva invalida|UNIQUE constraint failed: operaciones_reserva_admin/i.test(mensaje)) return null;
      throw error;
    }
    return this.obtenerResumenOperacion(entrada.operacionUid);
  }

  private eventoOperacion(
    entrada: { reservaId: number; operacionUid: string; actorEmail: string; correlationId: string; motivo?: string },
    tipo: string,
    version: number,
    cambios: string[]
  ): Statement {
    return this.db.prepare(`
      INSERT INTO reserva_eventos (
        reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
        evento_uid, version, agregado_tipo, agregado_id
      ) SELECT ?, ?, 'usuario', ?, ?, json_object(
        'version_reserva', ?, 'cambios', json(?), 'motivo', ?
      ), ?, 1, 'reserva', CAST(? AS TEXT)
      WHERE EXISTS (SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?)
    `).bind(
      entrada.reservaId, tipo, entrada.actorEmail, entrada.correlationId,
      version, JSON.stringify(cambios), entrada.motivo ?? null,
      `admin:${entrada.operacionUid}`, entrada.reservaId, entrada.operacionUid
    );
  }

  private auditoriaOperacion(
    entrada: { reservaId: number; operacionUid: string; actorEmail: string; correlationId: string; motivo?: string },
    accion: string,
    version: number
  ): Statement {
    return this.db.prepare(`
      INSERT INTO auditoria_admin (
        email, accion, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json
      ) SELECT ?, ?, 'usuario', 'reserva', ?, ?, ?, json_object('version_reserva', ?)
      WHERE EXISTS (SELECT 1 FROM operaciones_reserva_admin WHERE operacion_uid = ?)
    `).bind(
      entrada.actorEmail, accion, String(entrada.reservaId), entrada.motivo ?? null,
      entrada.correlationId, version, entrada.operacionUid
    );
  }

  private async obtenerResumenOperacion(operacionUid: string): Promise<ResumenReservaAdmin | null> {
    const row = await this.db.prepare(`
      SELECT ${SELECT_RESUMEN} ${FROM_RESERVA}
      JOIN operaciones_reserva_admin ora ON ora.reserva_id = r.id
      WHERE ora.operacion_uid = ?
    `).bind(operacionUid).first();
    return row ? mapearResumen(row) : null;
  }

  private async obtenerResumenPorUid(reservaUid: string): Promise<ResumenReservaAdmin | null> {
    const row = await this.db.prepare(`
      SELECT ${SELECT_RESUMEN} ${FROM_RESERVA} WHERE r.reserva_uid = ?
    `).bind(reservaUid).first();
    return row ? mapearResumen(row) : null;
  }
}
