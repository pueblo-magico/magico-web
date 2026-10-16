import type { RepositorioHorariosComidas } from '../../_application/reservas/ports.ts';
import type { HorariosComidas } from '../../_domain/reservas/baseConfiguration.ts';

type Statement = { first(): Promise<Record<string, unknown> | null> };
type Database = { prepare(query: string): Statement };

export class D1RepositorioHorariosComidas implements RepositorioHorariosComidas {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtener(): Promise<HorariosComidas> {
    const row = await this.db.prepare(`
      SELECT version, desayuno_desde, desayuno_hasta, almuerzo_desde,
        almuerzo_hasta, cena_desde, cena_hasta, updated_at
      FROM configuracion_horarios_comidas WHERE id = 1
    `).first();
    if (!row) throw new Error('missing meal schedule configuration');
    return {
      version: Number(row.version),
      desayuno: { desde: String(row.desayuno_desde), hasta: String(row.desayuno_hasta) },
      almuerzo: { desde: String(row.almuerzo_desde), hasta: String(row.almuerzo_hasta) },
      cena: { desde: String(row.cena_desde), hasta: String(row.cena_hasta) },
      actualizadoAt: String(row.updated_at),
    };
  }
}
