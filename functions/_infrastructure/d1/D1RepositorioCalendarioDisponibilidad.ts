import type { RepositorioCalendarioDisponibilidad } from '../../_application/reservas/ports.ts';
import type { AlojamientoCalendario, ReservaCalendario } from '../../_domain/reservas/models.ts';

type D1Result = { results?: Record<string, unknown>[] };

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all(): Promise<D1Result>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RepositorioCalendarioDisponibilidad implements RepositorioCalendarioDisponibilidad {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async listarAlojamientos(): Promise<AlojamientoCalendario[]> {
    const result = await this.db
      .prepare('SELECT id, nombre, tipo, capacidad_total FROM alojamientos ORDER BY id ASC')
      .all();

    return (result.results || []) as AlojamientoCalendario[];
  }

  async listarReservasActivas(desde: string, hasta: string): Promise<ReservaCalendario[]> {
    const result = await this.db
      .prepare(
        `SELECT alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas
         FROM reservas
         WHERE estado IN ('pendiente', 'confirmada')
           AND fecha_checkin < ?2 AND fecha_checkout > ?1`
      )
      .bind(desde, hasta)
      .all();

    return (result.results || []) as ReservaCalendario[];
  }
}
