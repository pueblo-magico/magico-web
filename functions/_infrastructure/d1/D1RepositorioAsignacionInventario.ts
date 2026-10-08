import type {
  AsignacionInventarioGuardada,
  RepositorioAsignacionInventario,
} from '../../_application/reservas/ports.ts';
import type { ModalidadAlojamiento } from '../../_domain/reservas/accommodationInventory.ts';
import { ErrorReserva } from '../../_domain/reservas/errors.ts';
import type {
  ContextoAsignacionInventario,
  PlanAsignacionInventario,
} from '../../_domain/reservas/inventoryAssignment.ts';

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

function errorInventario(error: unknown): never {
  const mensaje = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed: (ocupacion_noches|operaciones_asignacion_inventario)|inventario bloqueado|unidad no asignable/i.test(mensaje)) {
    throw new ErrorReserva('CONFLICTO_RESERVA', 'Una unidad está ocupada o bloqueada en alguna noche.');
  }
  if (/FOREIGN KEY constraint failed/i.test(mensaje)) {
    throw new ErrorReserva('DATOS_INVALIDOS', 'La reserva, el espacio o una unidad ya no existe.');
  }
  throw error;
}

export class D1RepositorioAsignacionInventario implements RepositorioAsignacionInventario {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtenerActual(reservaId: number): Promise<AsignacionInventarioGuardada | null> {
    const row = await this.db.prepare(`
      SELECT r.id reserva_id, r.version reserva_version, re.id estadia_id,
        re.modalidad, e.id espacio_id, e.codigo espacio_codigo
      FROM reservas r
      JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
      JOIN reserva_estadia_espacios ree ON ree.reserva_estadia_id = re.id
      JOIN espacios e ON e.id = ree.espacio_id
      WHERE r.id = ?
    `).bind(reservaId).first();
    if (!row) return null;
    const unidades = await this.db.prepare(`
      SELECT u.codigo, u.capacidad, MAX(onoc.cantidad_huespedes) cantidad_huespedes
      FROM ocupacion_noches onoc
      JOIN unidades_inventario u ON u.id = onoc.unidad_inventario_id
      WHERE onoc.reserva_estadia_id = ? AND onoc.estado = 'activa'
      GROUP BY u.id, u.codigo, u.capacidad
      ORDER BY u.codigo
    `).bind(row.estadia_id).all();
    const capacidad = await this.db.prepare(`
      WITH RECURSIVE descendientes(id) AS (
        SELECT ? UNION ALL SELECT e.id FROM espacios e JOIN descendientes d ON e.parent_id = d.id
      ), noches(fecha) AS (
        SELECT fecha_checkin FROM reserva_estadias WHERE id = ?
        UNION ALL SELECT date(fecha, '+1 day') FROM noches
          WHERE date(fecha, '+1 day') < (SELECT fecha_checkout FROM reserva_estadias WHERE id = ?)
      ), total(valor) AS (
        SELECT COALESCE(SUM(u.capacidad), 0) FROM unidades_inventario u
        JOIN descendientes d ON d.id = u.espacio_id
        WHERE u.estado = 'activa' AND u.asignable = 1
      ), ocupada AS (
        SELECT n.fecha, COALESCE(SUM(u.capacidad), 0) valor
        FROM noches n
        LEFT JOIN ocupacion_noches onoc ON onoc.fecha = n.fecha AND onoc.estado = 'activa'
        LEFT JOIN unidades_inventario u ON u.id = onoc.unidad_inventario_id
          AND u.espacio_id IN (SELECT id FROM descendientes)
        GROUP BY n.fecha
      )
      SELECT COALESCE(MIN(total.valor - ocupada.valor), total.valor) capacidad_restante
      FROM total LEFT JOIN ocupada ON 1 = 1
    `).bind(row.espacio_id, row.estadia_id, row.estadia_id).first();
    return {
      reservaId: Number(row.reserva_id),
      reservaVersion: Number(row.reserva_version),
      estadiaId: Number(row.estadia_id),
      espacioCodigo: String(row.espacio_codigo),
      modalidad: row.modalidad as ModalidadAlojamiento,
      capacidadRestante: Number(capacidad?.capacidad_restante) || 0,
      unidades: (unidades.results || []).map(unidad => ({
        codigo: String(unidad.codigo), capacidad: Number(unidad.capacidad),
        cantidadHuespedes: Number(unidad.cantidad_huespedes),
      })),
    };
  }

  async obtenerContexto(
    reservaId: number,
    espacioCodigo: string,
    modalidad: ModalidadAlojamiento
  ): Promise<ContextoAsignacionInventario | null> {
    const row = await this.db.prepare(`
      SELECT r.id reserva_id, r.version reserva_version, r.estado_flujo,
        re.id estadia_id, re.fecha_checkin, re.fecha_checkout, re.cantidad_huespedes,
        e.id espacio_id, e.codigo espacio_codigo, e.tipo espacio_tipo, e.capacidad_comercial,
        EXISTS (
          SELECT 1 FROM modalidades_espacio me
          WHERE me.espacio_id = e.id AND me.modalidad = ? AND me.habilitada = 1
            AND me.contexto = 'general'
        ) modalidad_habilitada
      FROM reservas r
      JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
      JOIN espacios e ON e.codigo = ? AND e.estado = 'activo'
      WHERE r.id = ?
    `).bind(modalidad, espacioCodigo, reservaId).first();
    if (!row) return null;
    const unidades = await this.db.prepare(`
      WITH RECURSIVE descendientes(id) AS (
        SELECT id FROM espacios WHERE id = ?
        UNION ALL
        SELECT e.id FROM espacios e JOIN descendientes d ON e.parent_id = d.id
      )
      SELECT u.id, u.codigo, u.capacidad
      FROM unidades_inventario u
      JOIN descendientes d ON d.id = u.espacio_id
      WHERE u.estado = 'activa' AND u.asignable = 1
      ORDER BY u.codigo
    `).bind(row.espacio_id).all();
    return {
      reservaId: Number(row.reserva_id),
      reservaVersion: Number(row.reserva_version),
      estadoFlujo: String(row.estado_flujo),
      estadiaId: Number(row.estadia_id),
      fechaCheckin: String(row.fecha_checkin),
      fechaCheckout: String(row.fecha_checkout),
      cantidadHuespedes: Number(row.cantidad_huespedes),
      espacioId: Number(row.espacio_id),
      espacioCodigo: String(row.espacio_codigo),
      espacioTipo: String(row.espacio_tipo),
      capacidadComercial: Number(row.capacidad_comercial),
      modalidad,
      modalidadHabilitada: Number(row.modalidad_habilitada) === 1,
      unidades: (unidades.results || []).map(unidad => ({
        id: Number(unidad.id), codigo: String(unidad.codigo), capacidad: Number(unidad.capacidad),
      })),
    };
  }

  async reemplazar(entrada: {
    contexto: ContextoAsignacionInventario;
    plan: PlanAsignacionInventario;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<AsignacionInventarioGuardada | null> {
    const { contexto, plan } = entrada;
    const nuevaVersion = contexto.reservaVersion + 1;
    const statements: Statement[] = [
      this.db.prepare(`
        INSERT INTO operaciones_asignacion_inventario (
          operacion_uid, reserva_id, reserva_estadia_id, accion, version_esperada,
          version_resultante, actor_ref, correlation_id
        )
        SELECT ?, r.id, re.id,
          CASE WHEN EXISTS (
            SELECT 1 FROM asignaciones_inventario ai
            WHERE ai.reserva_estadia_id = re.id AND ai.estado = 'activa'
          ) THEN 'cambiar' ELSE 'asignar' END,
          ?, ?, ?, ?
        FROM reservas r
        JOIN reserva_estadias re ON re.reserva_id = r.id AND re.id = ?
        WHERE r.id = ? AND r.version = ? AND r.estado_flujo = 'confirmada'
      `).bind(
        entrada.operacionUid, contexto.reservaVersion, nuevaVersion,
        entrada.actorEmail, entrada.correlationId, contexto.estadiaId,
        contexto.reservaId, contexto.reservaVersion
      ),
      this.db.prepare(`
        UPDATE reservas SET version = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND version = ? AND EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(nuevaVersion, contexto.reservaId, contexto.reservaVersion, entrada.operacionUid),
      this.db.prepare(`
        UPDATE ocupacion_noches SET estado = 'liberada',
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = ? AND estado = 'activa' AND EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(contexto.estadiaId, entrada.operacionUid),
      this.db.prepare(`
        UPDATE asignaciones_inventario SET estado = 'liberada',
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = ? AND estado = 'activa' AND EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(contexto.estadiaId, entrada.operacionUid),
      this.db.prepare(`
        UPDATE reserva_estadias SET modalidad = ?, espacio_solicitado_ref = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(contexto.modalidad, `espacio:${contexto.espacioCodigo}`, contexto.estadiaId, entrada.operacionUid),
      this.db.prepare(`
        INSERT INTO reserva_estadia_espacios (reserva_estadia_id, espacio_id, origen)
        SELECT ?, ?, 'asignacion_admin'
        WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
        ON CONFLICT (reserva_estadia_id) DO UPDATE SET espacio_id = excluded.espacio_id,
          origen = excluded.origen, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      `).bind(contexto.estadiaId, contexto.espacioId, entrada.operacionUid),
    ];

    for (const asignacion of plan.asignaciones) {
      statements.push(this.db.prepare(`
        INSERT INTO asignaciones_inventario (
          reserva_estadia_id, unidad_inventario_id, cantidad_huespedes,
          estado, operacion_uid, actor_ref, correlation_id
        )
        SELECT ?, ?, ?, 'activa', ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
      `).bind(
        contexto.estadiaId, asignacion.id, asignacion.cantidadHuespedes,
        entrada.operacionUid, entrada.actorEmail, entrada.correlationId, entrada.operacionUid
      ));
    }
    for (const unidad of plan.unidadesBloqueadas) {
      const asignacion = plan.asignaciones.find(item => item.id === unidad.id);
      for (const fecha of plan.noches) {
        statements.push(this.db.prepare(`
          INSERT INTO ocupacion_noches (
            reserva_estadia_id, asignacion_inventario_id, unidad_inventario_id,
            fecha, cantidad_huespedes, modalidad, estado, operacion_uid
          )
          SELECT ?, (
            SELECT id FROM asignaciones_inventario
            WHERE operacion_uid = ? AND unidad_inventario_id = ?
          ), ?, ?, ?, ?, 'activa', ?
          WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
        `).bind(
          contexto.estadiaId, entrada.operacionUid, unidad.id, unidad.id, fecha,
          asignacion?.cantidadHuespedes ?? 0, contexto.modalidad,
          entrada.operacionUid, entrada.operacionUid
        ));
      }
    }
    statements.push(
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        )
        SELECT ?, 'reserva.asignada', 'usuario', ?, ?, json_object(
          'espacio_codigo', ?, 'modalidad', ?, 'unidades', json(?),
          'version_reserva', ?
        ), ?, 1, 'asignacion', ?
        WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
      `).bind(
        contexto.reservaId, entrada.actorEmail, entrada.correlationId,
        contexto.espacioCodigo, contexto.modalidad,
        JSON.stringify(plan.unidadesBloqueadas.map(unidad => unidad.codigo)), nuevaVersion,
        `asignacion:${entrada.operacionUid}`, entrada.operacionUid, entrada.operacionUid
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, correlation_id, metadata_json
        ) SELECT ?, 'asignar_inventario', 'usuario', 'reserva', ?, ?, json_object(
          'operacion_uid', ?, 'version_reserva', ?
        ) WHERE EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(
        entrada.actorEmail, String(contexto.reservaId), entrada.correlationId,
        entrada.operacionUid, nuevaVersion, entrada.operacionUid
      )
    );

    try {
      await this.db.batch(statements);
      return this.obtenerResultado(entrada.operacionUid, contexto);
    } catch (error) {
      return errorInventario(error);
    }
  }

  async liberar(entrada: {
    reservaId: number;
    expectedVersion: number;
    operacionUid: string;
    actorEmail: string;
    correlationId: string;
  }): Promise<AsignacionInventarioGuardada | null> {
    const nuevaVersion = entrada.expectedVersion + 1;
    const statements = [
      this.db.prepare(`
        INSERT INTO operaciones_asignacion_inventario (
          operacion_uid, reserva_id, reserva_estadia_id, accion, version_esperada,
          version_resultante, actor_ref, correlation_id
        )
        SELECT ?, r.id, re.id, 'liberar', ?, ?, ?, ?
        FROM reservas r JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
        WHERE r.id = ? AND r.version = ? AND EXISTS (
          SELECT 1 FROM ocupacion_noches onoc
          WHERE onoc.reserva_estadia_id = re.id AND onoc.estado = 'activa'
        )
      `).bind(
        entrada.operacionUid, entrada.expectedVersion, nuevaVersion,
        entrada.actorEmail, entrada.correlationId, entrada.reservaId, entrada.expectedVersion
      ),
      this.db.prepare(`
        UPDATE reservas SET version = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND version = ? AND EXISTS (
          SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        )
      `).bind(nuevaVersion, entrada.reservaId, entrada.expectedVersion, entrada.operacionUid),
      this.db.prepare(`
        UPDATE ocupacion_noches SET estado = 'liberada', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = (
          SELECT reserva_estadia_id FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        ) AND estado = 'activa'
      `).bind(entrada.operacionUid),
      this.db.prepare(`
        UPDATE asignaciones_inventario SET estado = 'liberada', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_estadia_id = (
          SELECT reserva_estadia_id FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
        ) AND estado = 'activa'
      `).bind(entrada.operacionUid),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        ) SELECT ?, 'reserva.asignacion_liberada', 'usuario', ?, ?,
          json_object('version_reserva', ?), ?, 1, 'asignacion', ?
        WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
      `).bind(
        entrada.reservaId, entrada.actorEmail, entrada.correlationId, nuevaVersion,
        `asignacion:${entrada.operacionUid}`, entrada.operacionUid, entrada.operacionUid
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, actor_tipo, entidad_tipo, entidad_id, correlation_id, metadata_json
        ) SELECT ?, 'liberar_inventario', 'usuario', 'reserva', ?, ?,
          json_object('operacion_uid', ?, 'version_reserva', ?)
        WHERE EXISTS (SELECT 1 FROM operaciones_asignacion_inventario WHERE operacion_uid = ?)
      `).bind(
        entrada.actorEmail, String(entrada.reservaId), entrada.correlationId,
        entrada.operacionUid, nuevaVersion, entrada.operacionUid
      ),
    ];
    try {
      await this.db.batch(statements);
      const op = await this.db.prepare(`
        SELECT o.reserva_estadia_id
        FROM operaciones_asignacion_inventario o
        WHERE o.operacion_uid = ?
      `).bind(entrada.operacionUid).first();
      if (!op) return null;
      return this.obtenerActual(entrada.reservaId);
    } catch (error) {
      return errorInventario(error);
    }
  }

  private async obtenerResultado(
    operacionUid: string,
    contexto: ContextoAsignacionInventario
  ): Promise<AsignacionInventarioGuardada | null> {
    const operacion = await this.db.prepare(`
      SELECT version_resultante FROM operaciones_asignacion_inventario WHERE operacion_uid = ?
    `).bind(operacionUid).first();
    if (!operacion) return null;
    return this.obtenerActual(contexto.reservaId);
  }
}
