import type {
  ExcepcionPoliticaReserva,
  RepositorioExcepcionesPoliticaReserva,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
};
type Database = { prepare(query: string): Statement };

const CAMPOS = `
  id, reserva_id, tipo, estado, monto_devolucion_centavos,
  motivo, solicitada_por, resuelta_por
`;

function mapear(row: Record<string, unknown>): ExcepcionPoliticaReserva {
  return {
    id: Number(row.id),
    reservaId: Number(row.reserva_id),
    tipo: row.tipo as ExcepcionPoliticaReserva['tipo'],
    estado: row.estado as ExcepcionPoliticaReserva['estado'],
    montoDevolucionCentavos: row.monto_devolucion_centavos == null
      ? null : Number(row.monto_devolucion_centavos),
    motivo: String(row.motivo),
    solicitadaPor: String(row.solicitada_por),
    resueltaPor: row.resuelta_por == null ? null : String(row.resuelta_por),
  };
}

export class D1RepositorioExcepcionesPoliticaReserva implements RepositorioExcepcionesPoliticaReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async solicitar(
    entrada: Parameters<RepositorioExcepcionesPoliticaReserva['solicitar']>[0]
  ): Promise<ExcepcionPoliticaReserva | null> {
    const row = await this.db.prepare(`
      INSERT INTO excepciones_politica_reserva (
        reserva_id, tipo, monto_devolucion_centavos, motivo, solicitada_por
      )
      SELECT id, ?, ?, ?, ? FROM reservas WHERE id = ?
      RETURNING ${CAMPOS}
    `).bind(
      entrada.tipo, entrada.montoDevolucionCentavos, entrada.motivo,
      entrada.actorEmail, entrada.reservaId
    ).first();
    return row ? mapear(row) : null;
  }

  async resolver(
    id: number,
    estado: 'aprobada' | 'rechazada',
    actorEmail: string
  ): Promise<ExcepcionPoliticaReserva | null> {
    const row = await this.db.prepare(`
      UPDATE excepciones_politica_reserva
      SET estado = ?, resuelta_por = ?, resuelta_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ? AND estado = 'solicitada'
      RETURNING ${CAMPOS}
    `).bind(estado, actorEmail, id).first();
    return row ? mapear(row) : null;
  }
}
