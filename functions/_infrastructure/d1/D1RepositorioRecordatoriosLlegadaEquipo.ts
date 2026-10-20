import type { RepositorioRecordatoriosLlegadaEquipo } from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};

type Database = { prepare(query: string): Statement };

export class D1RepositorioRecordatoriosLlegadaEquipo implements RepositorioRecordatoriosLlegadaEquipo {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async programar(
    entrada: Parameters<RepositorioRecordatoriosLlegadaEquipo['programar']>[0]
  ): Promise<string[]> {
    const resultado = await this.db.prepare(`
      INSERT OR IGNORE INTO comunicacion_intenciones (
        intencion_uid, dedupe_key, reserva_id, source_event_uid, tipo, idioma,
        plantilla_codigo, plantilla_version, audiencia, created_at, next_attempt_at
      )
      SELECT
        'comunicacion:equipo:llegada:' || r.id || ':' || re.fecha_checkin || ':' || ?,
        'equipo:llegada:' || r.id || ':' || re.fecha_checkin || ':' || ?,
        r.id,
        'recordatorio-llegada:' || r.id || ':' || re.fecha_checkin || ':' || ?,
        'pago_pendiente', 'es', p.codigo, p.version, 'equipo', ?, ?
      FROM reservas r
      JOIN reserva_estadias re ON re.reserva_id = r.id AND re.tramo = 1
      JOIN comunicacion_plantillas p
        ON p.codigo = 'equipo_llegada_proxima'
       AND p.idioma = 'es'
       AND p.estado = 'publicada'
       AND p.audiencia = 'equipo'
      WHERE r.estado_flujo = 'confirmada' AND re.fecha_checkin = ?
      ORDER BY r.id
      LIMIT ?
      RETURNING intencion_uid
    `).bind(
      entrada.diasAnticipacion,
      entrada.diasAnticipacion,
      entrada.diasAnticipacion,
      entrada.creadoAt,
      entrada.creadoAt,
      entrada.fechaObjetivo,
      entrada.limite
    ).all();
    return (resultado.results || []).map(row => String(row.intencion_uid));
  }
}
