import type { RepositorioTarifasAlimentacion } from '../../_application/reservas/ports.ts';
import type {
  ConfiguracionTarifaAlimentacion,
  RegimenAlimentacion,
} from '../../_domain/reservas/alimentacion.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type Database = { prepare(query: string): Statement };

export class D1RepositorioTarifasAlimentacion implements RepositorioTarifasAlimentacion {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtenerPublicada(regimen: RegimenAlimentacion): Promise<ConfiguracionTarifaAlimentacion | null> {
    const row = await this.db.prepare(`
      SELECT codigo, version, moneda, precio_comida_centavos,
             comidas_adicionales_por_persona_noche
      FROM tarifas_alimentacion
      WHERE codigo = ? AND estado = 'publicado'
      LIMIT 1
    `).bind(regimen).first();
    if (!row) return null;
    return {
      codigo: String(row.codigo) as RegimenAlimentacion,
      version: Number(row.version),
      moneda: String(row.moneda),
      precioComidaCentavos: Number(row.precio_comida_centavos),
      comidasAdicionalesPorPersonaNoche: Number(row.comidas_adicionales_por_persona_noche),
    };
  }
}
