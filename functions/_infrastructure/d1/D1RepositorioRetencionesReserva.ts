import type { RepositorioRetencionesReserva } from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

export class D1RepositorioRetencionesReserva implements RepositorioRetencionesReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async expirarVencidas(ahoraIso: string, limite = 100): Promise<number[]> {
    const candidatas = await this.db.prepare(`
      SELECT reserva_id FROM retenciones_reserva
      WHERE estado = 'activa' AND expires_at <= ?
      ORDER BY expires_at, reserva_id LIMIT ?
    `).bind(ahoraIso, limite).all();
    const ids = (candidatas.results || []).map(row => Number(row.reserva_id));
    if (ids.length === 0) return [];

    await this.db.batch([
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json
        )
        SELECT reserva_id, 'reserva.retencion_vencida', 'sistema', 'expirador_retenciones',
               'hold-expiration:' || reserva_id, json_object('expires_at', expires_at)
        FROM retenciones_reserva
        WHERE estado = 'activa' AND expires_at <= ?
        ORDER BY expires_at, reserva_id LIMIT ?
      `).bind(ahoraIso, limite),
      this.db.prepare(`
        UPDATE ocupacion_reserva_noches SET estado = 'liberada'
        WHERE estado = 'retenida' AND reserva_estadia_id IN (
          SELECT re.id FROM reserva_estadias re
          WHERE re.reserva_id IN (
            SELECT reserva_id FROM retenciones_reserva
            WHERE estado = 'activa' AND expires_at <= ?
            ORDER BY expires_at, reserva_id LIMIT ?
          )
        )
      `).bind(ahoraIso, limite),
      this.db.prepare(`
        UPDATE retenciones_reserva
        SET estado = 'vencida', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE estado = 'activa' AND expires_at <= ? AND reserva_id IN (
          SELECT reserva_id FROM retenciones_reserva
          WHERE estado = 'activa' AND expires_at <= ?
          ORDER BY expires_at, reserva_id LIMIT ?
        )
      `).bind(ahoraIso, ahoraIso, limite),
      this.db.prepare(`
        UPDATE reservas SET estado = 'cancelada', estado_flujo = 'vencida'
        WHERE estado_flujo = 'pendiente_pago' AND id IN (
          SELECT reserva_id FROM retenciones_reserva
          WHERE estado = 'vencida' AND expires_at <= ?
          ORDER BY expires_at, reserva_id LIMIT ?
        )
      `).bind(ahoraIso, limite),
    ]);
    return ids;
  }
}
