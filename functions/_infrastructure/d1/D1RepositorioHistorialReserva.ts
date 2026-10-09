import type {
  EventoTimelineReserva,
  HistorialReserva,
  PagoTimelineReserva,
  RepositorioHistorialReserva,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results?: Record<string, unknown>[] }>;
};
type Database = { prepare(query: string): Statement };

function payloadSeguro(valor: unknown): Record<string, unknown> | null {
  if (typeof valor !== 'string' || !valor) return null;
  try {
    const parsed = JSON.parse(valor);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export class D1RepositorioHistorialReserva implements RepositorioHistorialReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async obtener(reservaId: number): Promise<HistorialReserva | null> {
    const [reserva, pagosResult, eventosResult] = await Promise.all([
      this.db.prepare(`
        SELECT id, estado, estado_flujo, moneda
        FROM reservas WHERE id = ?
      `).bind(reservaId).first(),
      this.db.prepare(`
        SELECT id, proveedor, tipo, estado, monto_centavos, moneda,
          external_payment_id, correlation_id, created_at, updated_at
        FROM pagos WHERE reserva_id = ?
        ORDER BY created_at, id
      `).bind(reservaId).all(),
      this.db.prepare(`
        SELECT id, tipo, version, actor_tipo, actor_ref, correlation_id,
          payload_json, created_at
        FROM reserva_eventos WHERE reserva_id = ?
        ORDER BY created_at, id
      `).bind(reservaId).all(),
    ]);
    if (!reserva) return null;

    const pagos: PagoTimelineReserva[] = (pagosResult.results || []).map(row => ({
      id: Number(row.id),
      proveedor: String(row.proveedor),
      tipo: String(row.tipo),
      estado: String(row.estado),
      montoCentavos: Number(row.monto_centavos),
      moneda: String(row.moneda),
      externalPaymentId: row.external_payment_id ? String(row.external_payment_id) : null,
      correlationId: row.correlation_id ? String(row.correlation_id) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
    const eventos: EventoTimelineReserva[] = (eventosResult.results || []).map(row => ({
      id: Number(row.id),
      tipo: String(row.tipo),
      version: Number(row.version),
      actorTipo: String(row.actor_tipo),
      actorRef: row.actor_ref ? String(row.actor_ref) : null,
      correlationId: row.correlation_id ? String(row.correlation_id) : null,
      payload: payloadSeguro(row.payload_json),
      createdAt: String(row.created_at),
    }));
    const aprobadoCentavos = pagos
      .filter(pago => pago.estado === 'aprobado' || pago.estado === 'devuelto')
      .reduce((total, pago) => total + pago.montoCentavos, 0);
    const devueltoCentavos = pagos
      .filter(pago => pago.estado === 'devuelto' || pago.tipo === 'devolucion')
      .reduce((total, pago) => total + pago.montoCentavos, 0);

    return {
      reservaId: Number(reserva.id),
      estado: String(reserva.estado),
      estadoFlujo: String(reserva.estado_flujo),
      resumenFinanciero: {
        moneda: String(reserva.moneda),
        intentos: pagos.length,
        aprobadoCentavos,
        devueltoCentavos,
        netoCentavos: aprobadoCentavos - devueltoCentavos,
      },
      pagos,
      eventos,
    };
  }
}
