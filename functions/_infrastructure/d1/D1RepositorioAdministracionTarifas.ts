import type {
  RepositorioAdministracionTarifas,
  ResumenPlanTarifa,
} from '../../_application/reservas/ports.ts';
import type { PlanTarifaBorrador } from '../../_domain/reservas/ratePlanAdministration.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Result = { results?: Record<string, unknown>[]; success?: boolean };
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Result[]>;
};

const CAMPOS = 'id, codigo, nombre, moneda, version, estado, publicado_at, created_at';

function mapear(row: Record<string, unknown>): ResumenPlanTarifa {
  return {
    id: Number(row.id), codigo: String(row.codigo), nombre: String(row.nombre), moneda: String(row.moneda),
    version: Number(row.version), estado: row.estado as ResumenPlanTarifa['estado'],
    publicadoAt: row.publicado_at == null ? null : String(row.publicado_at), createdAt: String(row.created_at),
  };
}

export class D1RepositorioAdministracionTarifas implements RepositorioAdministracionTarifas {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listar(): Promise<ResumenPlanTarifa[]> {
    const result = await this.db.prepare(`SELECT ${CAMPOS} FROM planes_tarifa ORDER BY codigo, version DESC`).all();
    return (result.results || []).map(mapear);
  }

  async crearBorrador(plan: PlanTarifaBorrador): Promise<ResumenPlanTarifa> {
    const statements: Statement[] = [this.db.prepare(`
      INSERT INTO planes_tarifa (codigo, nombre, moneda, version, estado)
      VALUES (?, ?, ?, (SELECT COALESCE(MAX(version), 0) + 1 FROM planes_tarifa WHERE codigo = ?), 'borrador')
    `).bind(plan.codigo, plan.nombre.trim(), plan.moneda, plan.codigo)];

    for (const temporada of plan.temporadas) {
      statements.push(this.db.prepare(`
        INSERT INTO temporadas (plan_tarifa_id, codigo, nombre, fecha_desde, fecha_hasta, prioridad)
        SELECT id, ?, ?, ?, ?, ? FROM planes_tarifa
        WHERE codigo = ? AND estado = 'borrador' ORDER BY version DESC LIMIT 1
      `).bind(
        temporada.codigo, temporada.nombre.trim(), temporada.fechaDesde, temporada.fechaHasta,
        temporada.prioridad, plan.codigo
      ));
      for (const regla of temporada.reglas) {
        statements.push(this.db.prepare(`
          INSERT INTO reglas_precio (
            temporada_id, tipo_alojamiento, modalidad, ocupacion_min, ocupacion_max,
            base_calculo, importe_centavos, exclusividad_desde, exclusividad_hasta
          )
          SELECT t.id, ?, ?, ?, ?, ?, ?, ?, ?
          FROM temporadas t JOIN planes_tarifa p ON p.id = t.plan_tarifa_id
          WHERE p.codigo = ? AND p.estado = 'borrador' AND t.codigo = ?
          ORDER BY p.version DESC LIMIT 1
        `).bind(
          regla.tipoAlojamiento, regla.modalidad, regla.ocupacionMin, regla.ocupacionMax,
          regla.baseCalculo, regla.importeCentavos, regla.exclusividadDesde ?? null,
          regla.exclusividadHasta ?? null, plan.codigo, temporada.codigo
        ));
      }
    }
    for (const sena of plan.senas) {
      statements.push(this.db.prepare(`
        INSERT INTO reglas_sena (
          plan_tarifa_id, subtotal_desde_centavos, subtotal_hasta_centavos, tipo, valor
        )
        SELECT id, ?, ?, ?, ? FROM planes_tarifa
        WHERE codigo = ? AND estado = 'borrador' ORDER BY version DESC LIMIT 1
      `).bind(
        sena.subtotalDesdeCentavos, sena.subtotalHastaCentavos, sena.tipo, sena.valor, plan.codigo
      ));
    }

    await this.db.batch(statements);
    const row = await this.db.prepare(`
      SELECT ${CAMPOS} FROM planes_tarifa
      WHERE codigo = ? AND estado = 'borrador' ORDER BY version DESC LIMIT 1
    `).bind(plan.codigo).first();
    if (!row) throw new Error('D1 no devolvió el borrador tarifario creado.');
    return mapear(row);
  }

  async publicar(planId: number): Promise<ResumenPlanTarifa | null> {
    const results = await this.db.batch([
      this.db.prepare(`
        UPDATE planes_tarifa SET estado = 'retirado'
        WHERE estado = 'publicado' AND codigo = (
          SELECT p.codigo FROM planes_tarifa p
          WHERE p.id = ? AND p.estado = 'borrador'
            AND EXISTS (SELECT 1 FROM temporadas t WHERE t.plan_tarifa_id = p.id)
            AND EXISTS (SELECT 1 FROM reglas_precio r JOIN temporadas t ON t.id = r.temporada_id WHERE t.plan_tarifa_id = p.id)
            AND EXISTS (SELECT 1 FROM reglas_sena s WHERE s.plan_tarifa_id = p.id)
        )
      `).bind(planId),
      this.db.prepare(`
        UPDATE planes_tarifa SET estado = 'publicado', publicado_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND estado = 'borrador'
          AND EXISTS (SELECT 1 FROM temporadas t WHERE t.plan_tarifa_id = planes_tarifa.id)
          AND EXISTS (SELECT 1 FROM reglas_precio r JOIN temporadas t ON t.id = r.temporada_id WHERE t.plan_tarifa_id = planes_tarifa.id)
          AND EXISTS (SELECT 1 FROM reglas_sena s WHERE s.plan_tarifa_id = planes_tarifa.id)
        RETURNING ${CAMPOS}
      `).bind(planId),
    ]);
    const row = results[1]?.results?.[0];
    return row ? mapear(row) : null;
  }
}
