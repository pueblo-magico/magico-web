import type {
  RepositorioDeduplicacionEventos,
  RepositorioOutboxIntegracion,
} from '../../_application/reservas/ports.ts';
import type { EventoOutboxIntegracion } from '../../_domain/reservas/integrationOutbox.ts';

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
