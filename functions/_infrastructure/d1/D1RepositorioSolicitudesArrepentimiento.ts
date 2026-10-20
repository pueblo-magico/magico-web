import type {
  EstadoSolicitudArrepentimiento,
  RepositorioSolicitudesArrepentimiento,
  SolicitudArrepentimiento,
} from '../../_application/reservas/gestionarArrepentimientos.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
  run(): Promise<unknown>;
};
type Database = { prepare(query: string): Statement };

const SELECT = `
  id, codigo, reserva_id, reserva_codigo_declarado, email_contacto, detalle,
  estado, idioma, mensaje_cliente, version,
  (SELECT estado FROM arrepentimiento_notificaciones n
    WHERE n.solicitud_id = solicitudes_arrepentimiento.id ORDER BY n.id DESC LIMIT 1) notificacion_estado,
  (SELECT notificacion_uid FROM arrepentimiento_notificaciones n
    WHERE n.solicitud_id = solicitudes_arrepentimiento.id ORDER BY n.id DESC LIMIT 1) notificacion_uid,
  (SELECT last_error_code FROM arrepentimiento_notificaciones n
    WHERE n.solicitud_id = solicitudes_arrepentimiento.id ORDER BY n.id DESC LIMIT 1) notificacion_error_codigo,
  request_hash, created_at, acknowledged_at, updated_at, resolved_at, resolved_by, resolution_note
`;

function mapear(row: Record<string, unknown>): SolicitudArrepentimiento {
  return {
    id: Number(row.id),
    codigo: String(row.codigo),
    reservaId: row.reserva_id == null ? null : Number(row.reserva_id),
    reservaCodigoDeclarado: row.reserva_codigo_declarado == null ? null : String(row.reserva_codigo_declarado),
    emailContacto: String(row.email_contacto),
    detalle: String(row.detalle),
    estado: String(row.estado) as EstadoSolicitudArrepentimiento,
    idioma: String(row.idioma) as 'es' | 'en',
    mensajeCliente: row.mensaje_cliente == null ? null : String(row.mensaje_cliente),
    version: Number(row.version),
    notificacionEstado: row.notificacion_estado == null ? null : String(row.notificacion_estado),
    notificacionUid: row.notificacion_uid == null ? null : String(row.notificacion_uid),
    notificacionErrorCodigo: row.notificacion_error_codigo == null ? null : String(row.notificacion_error_codigo),
    requestHash: String(row.request_hash),
    createdAt: String(row.created_at),
    acknowledgedAt: String(row.acknowledged_at),
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    resolvedBy: row.resolved_by == null ? null : String(row.resolved_by),
    resolutionNote: row.resolution_note == null ? null : String(row.resolution_note),
  };
}

export class D1RepositorioSolicitudesArrepentimiento implements RepositorioSolicitudesArrepentimiento {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async buscarPorIdempotencia(clave: string): Promise<SolicitudArrepentimiento | null> {
    const row = await this.db.prepare(`SELECT ${SELECT} FROM solicitudes_arrepentimiento WHERE idempotency_key = ?`)
      .bind(clave).first();
    return row ? mapear(row) : null;
  }

  async crear(entrada: Parameters<RepositorioSolicitudesArrepentimiento['crear']>[0]): Promise<SolicitudArrepentimiento> {
    await this.db.prepare(`
      INSERT INTO solicitudes_arrepentimiento (
        codigo, reserva_id, reserva_codigo_declarado, email_contacto, detalle,
        idempotency_key, request_hash, correlation_id, idioma
      ) VALUES (
        ?,
        (SELECT id FROM reservas
          WHERE UPPER(codigo) = UPPER(?) AND LOWER(COALESCE(cliente_email, '')) = LOWER(?)
          LIMIT 1),
        ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      entrada.codigo, entrada.reservaCodigo, entrada.email,
      entrada.reservaCodigo, entrada.email, entrada.detalle,
      entrada.idempotencyKey, entrada.requestHash, entrada.correlationId, entrada.idioma
    ).run();
    const creada = await this.buscarPorIdempotencia(entrada.idempotencyKey);
    if (!creada) throw new Error('SOLICITUD_NO_CREADA');
    return creada;
  }

  async listar(estado?: EstadoSolicitudArrepentimiento | null): Promise<SolicitudArrepentimiento[]> {
    const statement = estado
      ? this.db.prepare(`SELECT ${SELECT} FROM solicitudes_arrepentimiento WHERE estado = ? ORDER BY created_at DESC LIMIT 200`).bind(estado)
      : this.db.prepare(`SELECT ${SELECT} FROM solicitudes_arrepentimiento ORDER BY created_at DESC LIMIT 200`);
    const result = await statement.all();
    return (result.results || []).map(mapear);
  }

  async buscarPublica(codigo: string, email: string): Promise<SolicitudArrepentimiento | null> {
    const row = await this.db.prepare(`
      SELECT ${SELECT} FROM solicitudes_arrepentimiento
      WHERE UPPER(codigo) = UPPER(?) AND LOWER(email_contacto) = LOWER(?) LIMIT 1
    `).bind(codigo, email).first();
    return row ? mapear(row) : null;
  }

  async cambiarEstado(entrada: Parameters<RepositorioSolicitudesArrepentimiento['cambiarEstado']>[0]): Promise<SolicitudArrepentimiento | null> {
    const row = await this.db.prepare(`
      UPDATE solicitudes_arrepentimiento
      SET estado = ?, resolution_note = ?, mensaje_cliente = ?, resolved_by = ?, version = version + 1,
          resolved_at = CASE WHEN ? IN ('resuelta', 'rechazada')
            THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND estado = ?
      RETURNING ${SELECT}
    `).bind(
      entrada.estado, entrada.notaInterna, entrada.mensajeCliente, entrada.actorEmail,
      entrada.estado, entrada.id, entrada.estadoActual
    ).first();
    return row ? mapear(row) : null;
  }
}
