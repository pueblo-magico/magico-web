import type { RepositorioTarifas } from '../../_application/reservas/ports.ts';
import type { ConfiguracionTarifa } from '../../_domain/reservas/ratePlans.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};

type Database = { prepare(query: string): Statement };

export class D1RepositorioTarifas implements RepositorioTarifas {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtenerPublicada(): Promise<ConfiguracionTarifa | null> {
    const plan = await this.db.prepare(`
      SELECT id, codigo, version, moneda
      FROM planes_tarifa WHERE codigo = 'alojamiento-base' AND estado = 'publicado'
      LIMIT 1
    `).first();
    if (!plan) return null;
    const planId = Number(plan.id);

    const [precios, senas] = await Promise.all([
      this.db.prepare(`
        SELECT t.codigo temporada_codigo, t.fecha_desde, t.fecha_hasta, t.prioridad,
               r.tipo_alojamiento, r.modalidad, r.ocupacion_min, r.ocupacion_max,
               r.base_calculo, r.importe_centavos, r.exclusividad_desde, r.exclusividad_hasta
        FROM reglas_precio r JOIN temporadas t ON t.id = r.temporada_id
        WHERE t.plan_tarifa_id = ? ORDER BY t.prioridad DESC, r.id
      `).bind(planId).all(),
      this.db.prepare(`
        SELECT subtotal_desde_centavos, subtotal_hasta_centavos, tipo, valor
        FROM reglas_sena WHERE plan_tarifa_id = ? ORDER BY subtotal_desde_centavos
      `).bind(planId).all(),
    ]);

    return {
      planId,
      codigo: String(plan.codigo),
      version: Number(plan.version),
      moneda: String(plan.moneda),
      reglasPrecio: (precios.results || []).map(row => ({
        temporadaCodigo: String(row.temporada_codigo),
        fechaDesde: String(row.fecha_desde), fechaHasta: String(row.fecha_hasta),
        prioridad: Number(row.prioridad),
        tipoAlojamiento: row.tipo_alojamiento as any, modalidad: row.modalidad as any,
        ocupacionMin: Number(row.ocupacion_min), ocupacionMax: Number(row.ocupacion_max),
        baseCalculo: row.base_calculo as any, importeCentavos: Number(row.importe_centavos),
        exclusividadDesde: row.exclusividad_desde === null ? null : Number(row.exclusividad_desde),
        exclusividadHasta: row.exclusividad_hasta === null ? null : Number(row.exclusividad_hasta),
      })),
      reglasSena: (senas.results || []).map(row => ({
        subtotalDesdeCentavos: Number(row.subtotal_desde_centavos),
        subtotalHastaCentavos: row.subtotal_hasta_centavos === null ? null : Number(row.subtotal_hasta_centavos),
        tipo: row.tipo as any,
        valor: Number(row.valor),
      })),
    };
  }
}
