import type {
  CambiosReserva,
  CampoEditableReserva,
  RepositorioEdicionReserva,
} from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

const COLUMNAS_EDITABLES = new Set<CampoEditableReserva>([
  'cliente_nombre',
  'cliente_telefono',
  'cliente_email',
  'alojamiento_id',
  'fecha_checkin',
  'fecha_checkout',
  'cantidad_personas',
  'monto_total',
  'monto_sena',
  'estado',
  'canal_origen',
  'unidad_asignada',
]);

export class D1RepositorioEdicionReserva implements RepositorioEdicionReserva {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async actualizarParcial(reservaId: number, cambios: CambiosReserva): Promise<{ id: number } | null> {
    const entradas = Object.entries(cambios);
    if (entradas.length === 0 || entradas.some(([campo]) => !COLUMNAS_EDITABLES.has(campo as CampoEditableReserva))) {
      throw new Error('Campos de edición inválidos.');
    }

    const setClause = entradas.map(([campo]) => `${campo} = ?`).join(', ');
    const valores = entradas.map(([, valor]) => valor);
    const row = await this.db
      .prepare(`UPDATE reservas SET ${setClause} WHERE id = ? RETURNING id`)
      .bind(...valores, reservaId)
      .first();

    return row ? { id: Number(row.id) } : null;
  }
}
