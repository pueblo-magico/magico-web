import type {
  RepositorioDeduplicacionEventos,
  RepositorioOutboxIntegracion,
} from '../../_application/reservas/ports.ts';
import type { EventoOutboxIntegracion } from '../../_domain/reservas/integrationOutbox.ts';
import type { EstadoEventoOutbox, EstadoOperativoOutbox } from '../../_domain/reservas/integrationOutbox.ts';

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

function mapearEvento(row: Record<string, unknown>): EventoOutboxIntegracion {
  return {
    eventId: String(row.event_id),
    eventType: String(row.event_type),
    schemaVersion: Number(row.schema_version),
    aggregateType: String(row.aggregate_type),
    aggregateId: String(row.aggregate_id),
    payload: JSON.parse(String(row.payload_json)) as Record<string, unknown>,
    estado: String(row.estado) as EventoOutboxIntegracion['estado'],
    attempts: Number(row.attempts),
    occurredAt: String(row.occurred_at),
    createdAt: String(row.created_at),
  };
}

export class D1RepositorioOutboxIntegracion implements RepositorioOutboxIntegracion {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async consultarEstado(
    entrada: Parameters<RepositorioOutboxIntegracion['consultarEstado']>[0]
  ): Promise<EstadoOperativoOutbox> {
    const [conteos, eventos, pendiente, entregas24h] = await Promise.all([
      this.db.prepare(`
        SELECT estado, COUNT(*) cantidad FROM integration_outbox GROUP BY estado
      `).all(),
      this.db.prepare(`
        SELECT event_id, event_type, aggregate_type, aggregate_id, estado, attempts,
          next_attempt_at, last_error_code, occurred_at, created_at, delivered_at,
          MAX(0, CAST((julianday(?) - julianday(created_at)) * 86400 AS INTEGER)) age_seconds,
          CASE WHEN delivered_at IS NULL THEN NULL ELSE
            MAX(0, CAST((julianday(delivered_at) - julianday(created_at)) * 86400 AS INTEGER))
          END delivery_latency_seconds
        FROM integration_outbox
        ORDER BY created_at DESC, id DESC LIMIT ?
      `).bind(entrada.ahora, entrada.limite).all(),
      this.db.prepare(`
        SELECT MAX(0, CAST((julianday(?) - julianday(MIN(created_at))) * 86400 AS INTEGER)) edad
        FROM integration_outbox WHERE estado IN ('pending', 'processing')
      `).bind(entrada.ahora).first(),
      this.db.prepare(`
        SELECT COUNT(*) intentos,
          COALESCE(SUM(CASE WHEN resultado = 'delivered' THEN 0 ELSE 1 END), 0) fallas
        FROM integration_outbox_attempts
        WHERE julianday(completed_at) >= julianday(?) - 1
      `).bind(entrada.ahora).first(),
    ]);
    const resumen: Record<EstadoEventoOutbox, number> = {
      pending: 0, processing: 0, delivered: 0, dead_letter: 0,
    };
    for (const row of conteos.results || []) {
      const estado = String(row.estado) as EstadoEventoOutbox;
      if (estado in resumen) resumen[estado] = Number(row.cantidad);
    }
    return {
      resumen,
      oldestPendingAgeSeconds: pendiente?.edad == null ? null : Number(pendiente.edad),
      deliveryLast24h: {
        attempts: Number(entregas24h?.intentos || 0),
        failures: Number(entregas24h?.fallas || 0),
        failureRate: Number(entregas24h?.intentos || 0) === 0 ? 0
          : Number(entregas24h?.fallas || 0) / Number(entregas24h?.intentos),
      },
      eventos: (eventos.results || []).map(row => ({
        eventId: String(row.event_id),
        eventType: String(row.event_type),
        aggregateType: String(row.aggregate_type),
        aggregateId: String(row.aggregate_id),
        estado: String(row.estado) as EstadoEventoOutbox,
        attempts: Number(row.attempts),
        nextAttemptAt: String(row.next_attempt_at),
        lastErrorCode: row.last_error_code == null ? null : String(row.last_error_code),
        occurredAt: String(row.occurred_at),
        createdAt: String(row.created_at),
        deliveredAt: row.delivered_at == null ? null : String(row.delivered_at),
        ageSeconds: Number(row.age_seconds),
        deliveryLatencySeconds: row.delivery_latency_seconds == null
          ? null : Number(row.delivery_latency_seconds),
      })),
    };
  }

  async reprocesarDeadLetter(
    entrada: Parameters<RepositorioOutboxIntegracion['reprocesarDeadLetter']>[0]
  ): Promise<boolean> {
    const existente = await this.db.prepare(`
      SELECT event_id FROM integration_outbox WHERE event_id = ? AND estado = 'dead_letter'
    `).bind(entrada.eventId).first();
    if (!existente) return false;
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, detalle, actor_tipo, entidad_tipo, entidad_id,
          motivo, correlation_id, metadata_json
        )
        SELECT ?, 'reprocesar_evento_outbox', NULL, 'usuario', 'integration_outbox',
          event_id, ?, ?, json_object('intentos_anteriores', attempts, 'error_anterior', last_error_code)
        FROM integration_outbox WHERE event_id = ? AND estado = 'dead_letter'
      `).bind(
        entrada.actorEmail, entrada.motivo, entrada.correlationId, entrada.eventId
      ),
      this.db.prepare(`
        UPDATE integration_outbox
        SET estado = 'pending', attempts = 0, next_attempt_at = ?,
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          last_error_code = NULL
        WHERE event_id = ? AND estado = 'dead_letter'
      `).bind(entrada.ahora, entrada.eventId),
    ]);
    return true;
  }

  async reclamarLote(
    entrada: Parameters<RepositorioOutboxIntegracion['reclamarLote']>[0]
  ): Promise<EventoOutboxIntegracion[]> {
    const resultado = await this.db.prepare(`
      UPDATE integration_outbox
      SET estado = 'processing', claim_uid = ?, claimed_at = ?, claim_expires_at = ?,
        attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM integration_outbox
        WHERE (
          (estado = 'pending' AND next_attempt_at <= ?)
          OR (estado = 'processing' AND claim_expires_at <= ?)
        )
        ORDER BY created_at, id LIMIT ?
      )
      RETURNING event_id, event_type, schema_version, aggregate_type, aggregate_id,
        payload_json, estado, attempts, occurred_at, created_at
    `).bind(
      entrada.claimUid, entrada.ahora, entrada.claimExpiresAt,
      entrada.ahora, entrada.ahora, entrada.limite
    ).all();
    return (resultado.results || []).map(mapearEvento);
  }

  async marcarEntregado(
    entrada: Parameters<RepositorioOutboxIntegracion['marcarEntregado']>[0]
  ): Promise<void> {
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO integration_outbox_attempts (
          event_id, delivery_uid, consumer, resultado, started_at, completed_at
        )
        SELECT event_id, ? || ':' || event_id, ?, 'delivered', claimed_at, ?
        FROM integration_outbox
        WHERE event_id = ? AND estado = 'processing' AND claim_uid = ?
      `).bind(
        entrada.claimUid, entrada.consumer, entrada.completedAt,
        entrada.eventId, entrada.claimUid
      ),
      this.db.prepare(`
        UPDATE integration_outbox
        SET estado = 'delivered', delivered_at = ?, claim_uid = NULL,
          claimed_at = NULL, claim_expires_at = NULL, last_error_code = NULL
        WHERE event_id = ? AND estado = 'processing' AND claim_uid = ?
      `).bind(entrada.completedAt, entrada.eventId, entrada.claimUid),
    ]);
  }

  async marcarFalla(
    entrada: Parameters<RepositorioOutboxIntegracion['marcarFalla']>[0]
  ): Promise<void> {
    const estado = entrada.deadLetter ? 'dead_letter' : 'pending';
    const resultado = entrada.deadLetter ? 'dead_letter' : 'retry';
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO integration_outbox_attempts (
          event_id, delivery_uid, consumer, resultado, error_code, started_at, completed_at
        )
        SELECT event_id, ? || ':' || event_id, ?, ?, ?, claimed_at, ?
        FROM integration_outbox
        WHERE event_id = ? AND estado = 'processing' AND claim_uid = ?
      `).bind(
        entrada.claimUid, entrada.consumer, resultado, entrada.errorCode,
        entrada.completedAt, entrada.eventId, entrada.claimUid
      ),
      this.db.prepare(`
        UPDATE integration_outbox
        SET estado = ?, next_attempt_at = COALESCE(?, next_attempt_at),
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          last_error_code = ?
        WHERE event_id = ? AND estado = 'processing' AND claim_uid = ?
      `).bind(
        estado, entrada.nextAttemptAt, entrada.errorCode,
        entrada.eventId, entrada.claimUid
      ),
    ]);
  }
}

export class D1RepositorioDeduplicacionEventos implements RepositorioDeduplicacionEventos {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async registrarProcesado(consumer: string, eventId: string): Promise<boolean> {
    const row = await this.db.prepare(`
      INSERT INTO integration_processed_events (consumer, event_id)
      VALUES (?, ?) ON CONFLICT (consumer, event_id) DO NOTHING
      RETURNING event_id
    `).bind(consumer, eventId).first();
    return Boolean(row);
  }
}
