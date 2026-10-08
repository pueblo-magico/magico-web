import type { RepositorioBackfillCucuru } from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};
type Database = { prepare(query: string): Statement };

export class D1RepositorioBackfillCucuru implements RepositorioBackfillCucuru {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async adquirirLock(entrada: Parameters<RepositorioBackfillCucuru['adquirirLock']>[0]) {
    const row = await this.db.prepare(`
      INSERT INTO cucuru_backfill_checkpoints (
        alcance, lock_uid, lock_expires_at
      ) VALUES (?, ?, ?)
      ON CONFLICT (alcance) DO UPDATE SET
        lock_uid = excluded.lock_uid,
        lock_expires_at = excluded.lock_expires_at,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE cucuru_backfill_checkpoints.lock_uid IS NULL
         OR cucuru_backfill_checkpoints.lock_expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      RETURNING cursor, window_start_at, window_end_at
    `).bind(entrada.alcance, entrada.lockUid, entrada.lockExpiresAt).first();
    return row ? {
      cursor: row.cursor == null ? null : String(row.cursor),
      windowStartAt: row.window_start_at == null ? null : String(row.window_start_at),
      windowEndAt: row.window_end_at == null ? null : String(row.window_end_at),
    } : null;
  }

  async guardarCheckpoint(entrada: Parameters<RepositorioBackfillCucuru['guardarCheckpoint']>[0]) {
    const row = await this.db.prepare(`
      UPDATE cucuru_backfill_checkpoints
      SET cursor = ?, window_start_at = ?, window_end_at = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE alcance = ? AND lock_uid = ?
      RETURNING alcance
    `).bind(
      entrada.cursor, entrada.windowStartAt, entrada.windowEndAt,
      entrada.alcance, entrada.lockUid
    ).first();
    return Boolean(row);
  }

  async liberarLock(alcance: string, lockUid: string) {
    await this.db.prepare(`
      UPDATE cucuru_backfill_checkpoints
      SET lock_uid = NULL, lock_expires_at = NULL,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE alcance = ? AND lock_uid = ?
    `).bind(alcance, lockUid).run();
  }
}

