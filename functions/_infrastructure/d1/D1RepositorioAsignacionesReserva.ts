import type {
  AsignacionUnidadGuardada,
  RepositorioAsignacionesReserva,
} from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RepositorioAsignacionesReserva implements RepositorioAsignacionesReserva {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async asignarUnidad(reservaId: number, unidadAsignada: string): Promise<AsignacionUnidadGuardada | null> {
    const row = await this.db
      .prepare('UPDATE reservas SET unidad_asignada = ? WHERE id = ? RETURNING id, unidad_asignada')
      .bind(unidadAsignada, reservaId)
      .first();

    if (!row) return null;
    return {
      id: Number(row.id),
      unidad_asignada: row.unidad_asignada === null ? null : String(row.unidad_asignada),
    };
  }
}
