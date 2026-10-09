import type {
  EstadoReservaPublica,
  RepositorioConsultaEstadoReservaPublica,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type Database = { prepare(query: string): Statement };

export class D1RepositorioConsultaEstadoReservaPublica implements RepositorioConsultaEstadoReservaPublica {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async obtenerPorCodigo(codigo: string): Promise<EstadoReservaPublica | null> {
    const row = await this.db.prepare(`
      SELECT r.codigo, r.estado_flujo, r.hold_expires_at,
             p.estado pago_estado
      FROM reservas r
      LEFT JOIN pagos p ON p.id = (
        SELECT id FROM pagos
        WHERE reserva_id = r.id AND proveedor = 'mercado_pago'
        ORDER BY CASE estado WHEN 'aprobado' THEN 0 ELSE 1 END, id DESC
        LIMIT 1
      )
      WHERE r.codigo = ?
      LIMIT 1
    `).bind(codigo).first();
    return row ? {
      codigo: String(row.codigo),
      estado: String(row.estado_flujo),
      expiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
      pagoEstado: row.pago_estado ? String(row.pago_estado) : null,
    } : null;
  }
}
