import type { RepositorioDisponibilidad } from '../../_application/reservas/ports.ts';
import type { Disponibilidad, SolicitudCotizacion } from '../../_domain/reservas/models.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RepositorioDisponibilidad implements RepositorioDisponibilidad {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async consultar(solicitud: SolicitudCotizacion): Promise<Disponibilidad> {
    if (solicitud.tipo === 'domo') {
      const libre = (await this.db
        .prepare(
          `SELECT a.id FROM alojamientos a
           WHERE a.tipo = 'domo'
           AND a.id NOT IN (
             SELECT r.alojamiento_id FROM reservas r
             WHERE r.estado IN ('pendiente', 'confirmada')
             AND r.fecha_checkin < ?2 AND r.fecha_checkout > ?1
           )
           AND NOT EXISTS (
             SELECT 1
             FROM ocupacion_operativa oo
             LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
             LEFT JOIN espacios e ON e.id = COALESCE(oo.espacio_id, ui.espacio_id)
             WHERE oo.fecha_desde < ?2 AND oo.fecha_hasta > ?1
               AND e.codigo = CASE a.id WHEN 1 THEN 'domo-1' WHEN 2 THEN 'domo-2' END
           )
           LIMIT 1`
        )
        .bind(solicitud.fechaEntrada, solicitud.fechaSalida)
        .first()) as { id: number } | null;

      return {
        estado: libre ? 'disponible' : 'ocupado',
        alojamiento_id: libre ? Number(libre.id) : null,
      };
    }

    const row = (await this.db
      .prepare(
        `SELECT a.id AS id, a.capacidad_total AS capacidad_total,
                COALESCE(SUM(
                  CASE WHEN r.estado IN ('pendiente', 'confirmada')
                    AND r.fecha_checkin < ?2 AND r.fecha_checkout > ?1
                  THEN r.cantidad_personas ELSE 0 END
                ), 0) AS ocupadas,
                COALESCE((
                  SELECT SUM(CASE
                    WHEN oo.origen_tipo = 'estadia_no_comercial' THEN oo.cantidad_personas
                    WHEN oo.unidad_inventario_id IS NOT NULL THEN ui.capacidad
                    ELSE objetivo.capacidad_comercial
                  END)
                  FROM ocupacion_operativa oo
                  LEFT JOIN unidades_inventario ui ON ui.id = oo.unidad_inventario_id
                  LEFT JOIN espacios objetivo ON objetivo.id = COALESCE(oo.espacio_id, ui.espacio_id)
                  LEFT JOIN espacios padre ON padre.id = objetivo.parent_id
                  WHERE oo.fecha_desde < ?2 AND oo.fecha_hasta > ?1
                    AND COALESCE(padre.codigo, objetivo.codigo) = 'refugio'
                ), 0) AS operativas
         FROM alojamientos a
         LEFT JOIN reservas r ON r.alojamiento_id = a.id
         WHERE a.tipo = 'refugio'
         GROUP BY a.id`
      )
      .bind(solicitud.fechaEntrada, solicitud.fechaSalida)
      .first()) as { id: number; capacidad_total: number; ocupadas: number; operativas?: number } | null;

    const capacidad = row ? Number(row.capacidad_total) : 15;
    const ocupadas = row ? Number(row.ocupadas) : 0;
    const operativas = row ? Number(row.operativas || 0) : 0;
    const disponible = ocupadas + operativas + solicitud.personas <= capacidad;

    return {
      estado: disponible ? 'disponible' : 'ocupado',
      alojamiento_id: row ? Number(row.id) : null,
    };
  }
}
