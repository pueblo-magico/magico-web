import type {
  RepositorioEstadoPagoReserva,
  ReservaConfirmadaParaNotificar,
} from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

type D1Database = { prepare(query: string): D1Statement };

export class D1RepositorioEstadoPagoReserva implements RepositorioEstadoPagoReserva {
  private readonly db: D1Database;

  constructor(db: D1Database) { this.db = db; }

  async confirmar(reservaId: number, pagoId: string): Promise<ReservaConfirmadaParaNotificar | null> {
    const row = await this.db
      .prepare(
        `UPDATE reservas SET estado = 'confirmada', mp_payment_id = ?
         WHERE id = ? AND estado != 'confirmada'
         RETURNING manychat_user_id, fecha_checkin, fecha_checkout`
      )
      .bind(pagoId, reservaId)
      .first();

    if (!row) return null;
    return {
      manyChatUserId: row.manychat_user_id ? String(row.manychat_user_id) : null,
      fechaCheckin: String(row.fecha_checkin),
      fechaCheckout: String(row.fecha_checkout),
    };
  }

  async cancelarPendiente(reservaId: number, pagoId: string): Promise<void> {
    await this.db
      .prepare("UPDATE reservas SET estado = 'cancelada', mp_payment_id = ? WHERE id = ? AND estado = 'pendiente'")
      .bind(pagoId, reservaId)
      .run();
  }
}
