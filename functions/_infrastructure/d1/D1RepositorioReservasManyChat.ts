import type {
  RepositorioReservasManyChat,
  ReservaPendienteManyChat,
} from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RepositorioReservasManyChat implements RepositorioReservasManyChat {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async crearPendiente(reserva: ReservaPendienteManyChat): Promise<{ id: number | undefined }> {
    const row = await this.db
      .prepare(
        `INSERT INTO reservas
          (cliente_nombre, alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena, estado, manychat_user_id, canal_origen, cotizacion_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, 'ManyChat', ?)
         RETURNING id`
      )
      .bind(
        reserva.clienteNombre,
        reserva.alojamientoId,
        reserva.fechaCheckin,
        reserva.fechaCheckout,
        reserva.cantidadPersonas,
        reserva.montoTotal,
        reserva.montoSena,
        reserva.manyChatUserId,
        reserva.cotizacionId
      )
      .first();

    return { id: row?.id === undefined ? undefined : Number(row.id) };
  }

  async guardarPreferenciaPago(reservaId: number, preferenciaId: string): Promise<void> {
    await this.db
      .prepare('UPDATE reservas SET mp_preference_id = ? WHERE id = ?')
      .bind(preferenciaId, reservaId)
      .run();
  }
}
