import type {
  NotificacionArrepentimientoReclamada,
  RepositorioNotificacionesArrepentimiento,
} from '../../_application/reservas/gestionarNotificacionesArrepentimiento.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<{ meta?: { changes?: number } } | unknown>;
};
type Database = { prepare(query: string): Statement; batch(statements: Statement[]): Promise<unknown[]> };

export class D1RepositorioNotificacionesArrepentimiento implements RepositorioNotificacionesArrepentimiento {
  private readonly db: Database;
  constructor(db: Database) { this.db = db; }

  async reclamar(entrada: Parameters<RepositorioNotificacionesArrepentimiento['reclamar']>[0]): Promise<NotificacionArrepentimientoReclamada | null> {
    await this.db.prepare(`
      UPDATE arrepentimiento_notificaciones
      SET estado = 'procesando', claim_uid = ?, claimed_at = ?, claim_expires_at = ?,
          attempts = attempts + 1
      WHERE notificacion_uid = ? AND (
        (estado = 'pendiente' AND julianday(next_attempt_at) <= julianday(?) + (1.0 / 86400.0))
        OR (estado = 'procesando' AND julianday(claim_expires_at) <= julianday(?))
      )
    `).bind(
      entrada.claimUid, entrada.ahora, entrada.claimExpiresAt,
      entrada.notificacionUid, entrada.ahora, entrada.ahora
    ).run();
    const row = await this.db.prepare(`
      SELECT n.notificacion_uid, n.solicitud_id, n.tipo, n.idioma, n.attempts,
        s.email_contacto, s.codigo, s.mensaje_cliente, n.claimed_at
      FROM arrepentimiento_notificaciones n
      JOIN solicitudes_arrepentimiento s ON s.id = n.solicitud_id
      WHERE n.notificacion_uid = ? AND n.estado = 'procesando' AND n.claim_uid = ?
    `).bind(entrada.notificacionUid, entrada.claimUid).first();
    if (!row) return null;
    return {
      notificacionUid: String(row.notificacion_uid),
      solicitudId: Number(row.solicitud_id),
      tipo: String(row.tipo) as NotificacionArrepentimientoReclamada['tipo'],
      idioma: String(row.idioma) as 'es' | 'en',
      attempts: Number(row.attempts),
      email: String(row.email_contacto),
      codigo: String(row.codigo),
      mensajeCliente: row.mensaje_cliente == null ? null : String(row.mensaje_cliente),
      claimedAt: String(row.claimed_at),
    };
  }

  async finalizar(entrada: Parameters<RepositorioNotificacionesArrepentimiento['finalizar']>[0]): Promise<boolean> {
    const yaProcesada = await this.db.prepare(`
      SELECT id FROM arrepentimiento_notificacion_intentos
      WHERE delivery_uid = ? AND notificacion_uid = ?
    `).bind(entrada.deliveryUid, entrada.notificacionUid).first();
    if (yaProcesada) return true;
    const existe = await this.db.prepare(`
      SELECT id FROM arrepentimiento_notificaciones
      WHERE notificacion_uid = ? AND claim_uid = ? AND estado = 'procesando'
    `).bind(entrada.notificacionUid, entrada.claimUid).first();
    if (!existe) return false;
    const statements = [
      this.db.prepare(`
        INSERT OR IGNORE INTO arrepentimiento_notificacion_intentos (
          notificacion_uid, delivery_uid, resultado, error_code, started_at, completed_at
        ) SELECT notificacion_uid, ?, ?, ?, claimed_at, ?
          FROM arrepentimiento_notificaciones WHERE notificacion_uid = ? AND claim_uid = ?
      `).bind(
        entrada.deliveryUid, entrada.resultado, entrada.errorCode, entrada.completedAt,
        entrada.notificacionUid, entrada.claimUid
      ),
      this.db.prepare(`
        UPDATE arrepentimiento_notificaciones
        SET estado = ?, next_attempt_at = COALESCE(?, next_attempt_at),
          claim_uid = NULL, claimed_at = NULL, claim_expires_at = NULL,
          last_error_code = ?, delivered_at = CASE WHEN ? = 'entregada' THEN ? ELSE delivered_at END
        WHERE notificacion_uid = ? AND claim_uid = ? AND estado = 'procesando'
      `).bind(
        entrada.resultado === 'entregada' ? 'entregada' : entrada.resultado === 'retry' ? 'pendiente' : 'dead_letter',
        entrada.nextAttemptAt, entrada.errorCode, entrada.resultado, entrada.completedAt,
        entrada.notificacionUid, entrada.claimUid
      ),
    ];
    if (entrada.resultado === 'retry' && entrada.nextAttemptAt) {
      statements.push(this.db.prepare(`
        UPDATE integration_outbox
        SET estado = 'pending', next_attempt_at = ?, claimed_at = NULL,
          claim_uid = NULL, claim_expires_at = NULL, last_error_code = ?
        WHERE event_id = ?
      `).bind(entrada.nextAttemptAt, entrada.errorCode, entrada.notificacionUid));
    }
    await this.db.batch(statements);
    return true;
  }

  async reprocesar(entrada: Parameters<RepositorioNotificacionesArrepentimiento['reprocesar']>[0]): Promise<boolean> {
    const existe = await this.db.prepare(`
      SELECT id FROM arrepentimiento_notificaciones WHERE notificacion_uid = ? AND estado = 'dead_letter'
    `).bind(entrada.notificacionUid).first();
    if (!existe) return false;
    await this.db.batch([
      this.db.prepare(`
        UPDATE arrepentimiento_notificaciones
        SET estado = 'pendiente', attempts = 0, next_attempt_at = ?, claim_uid = NULL,
          claimed_at = NULL, claim_expires_at = NULL, last_error_code = NULL
        WHERE notificacion_uid = ? AND estado = 'dead_letter'
      `).bind(entrada.ahora, entrada.notificacionUid),
      this.db.prepare(`
        UPDATE integration_outbox
        SET estado = 'pending', attempts = 0, next_attempt_at = ?, claimed_at = NULL,
          claim_uid = NULL, claim_expires_at = NULL, last_error_code = NULL, delivered_at = NULL
        WHERE event_id = ?
      `).bind(entrada.ahora, entrada.notificacionUid),
    ]);
    return true;
  }
}
