import type { RepositorioPanelReservas } from '../../_application/reservas/ports.ts';
import type {
  AlojamientoPanel,
  ConversionManyChat,
  PendienteVieja,
  ReservaPanel,
} from '../../_domain/reservas/models.ts';

type D1Result = { results?: Record<string, unknown>[] };

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<D1Result>;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

const CAMPOS_RESERVA = `
  r.id, r.cliente_nombre, r.cliente_telefono, r.cliente_email,
  r.alojamiento_id, a.nombre AS alojamiento_nombre, a.tipo AS alojamiento_tipo,
  r.fecha_checkin, r.fecha_checkout, r.cantidad_personas,
  r.monto_total, r.monto_sena, r.estado, r.unidad_asignada, r.canal_origen,
  r.mp_preference_id, r.mp_payment_id, r.manychat_user_id, r.created_at
`;

export class D1RepositorioPanelReservas implements RepositorioPanelReservas {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async listarAlojamientos(): Promise<AlojamientoPanel[]> {
    const result = await this.db
      .prepare('SELECT id, nombre, tipo, capacidad_total FROM alojamientos ORDER BY id ASC')
      .all();
    return (result.results || []) as AlojamientoPanel[];
  }

  async listarReservasOperativas(): Promise<ReservaPanel[]> {
    const result = await this.db
      .prepare(
        `SELECT ${CAMPOS_RESERVA}
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         WHERE r.estado IN ('confirmada', 'pendiente')
           AND DATE(r.fecha_checkout) >= DATE('now')
         ORDER BY r.fecha_checkin ASC`
      )
      .all();
    return (result.results || []) as ReservaPanel[];
  }

  async listarHistorial(): Promise<ReservaPanel[]> {
    const result = await this.db
      .prepare(
        `SELECT ${CAMPOS_RESERVA}
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         ORDER BY r.fecha_checkin DESC`
      )
      .all();
    return (result.results || []) as ReservaPanel[];
  }

  async listarPendientesViejas(umbralDias: number): Promise<PendienteVieja[]> {
    const result = await this.db
      .prepare(
        `SELECT r.id, r.cliente_nombre, r.cliente_telefono, r.monto_sena, r.created_at,
                a.nombre AS alojamiento_nombre
         FROM reservas r
         JOIN alojamientos a ON a.id = r.alojamiento_id
         WHERE r.estado = 'pendiente' AND r.created_at < datetime('now', ?)
         ORDER BY r.created_at ASC`
      )
      .bind(`-${umbralDias} days`)
      .all();
    return (result.results || []) as PendienteVieja[];
  }

  async obtenerConversionManyChat(): Promise<ConversionManyChat> {
    const row = await this.db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas
         FROM reservas
         WHERE manychat_user_id IS NOT NULL`
      )
      .first();

    return {
      total: Number(row?.total) || 0,
      confirmadas: Number(row?.confirmadas) || 0,
    };
  }
}
