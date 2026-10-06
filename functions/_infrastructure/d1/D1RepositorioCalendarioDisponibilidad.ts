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
           AND fecha_checkin < ?2 AND fecha_checkout > ?1
         UNION ALL
         SELECT
           CASE COALESCE(padre.codigo, objetivo.codigo)
             WHEN 'domo-1' THEN 1 WHEN 'domo-2' THEN 2 WHEN 'refugio' THEN 3
           END alojamiento_id,
           oo.fecha_desde fecha_checkin,
           oo.fecha_hasta fecha_checkout,
           CASE
             WHEN oo.origen_tipo = 'estadia_no_comercial' THEN oo.cantidad_personas
             WHEN COALESCE(padre.codigo, objetivo.codigo) IN ('domo-1', 'domo-2') THEN 7
             WHEN oo.unidad_inventario_id IS NOT NULL THEN ui.capacidad
             ELSE objetivo.capacidad_comercial
           END cantidad_personas
         FROM ocupacion_operativa oo
         LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
         LEFT JOIN espacios objetivo ON objetivo.id = COALESCE(oo.espacio_id, ui.espacio_id)
         LEFT JOIN espacios padre ON padre.id = objetivo.parent_id
         WHERE oo.fecha_desde < ?2 AND oo.fecha_hasta > ?1
           AND COALESCE(padre.codigo, objetivo.codigo) IN ('domo-1', 'domo-2', 'refugio')`
      )
      .bind(desde, hasta)
      .all();

    return (result.results || []) as ReservaCalendario[];
  }
}
