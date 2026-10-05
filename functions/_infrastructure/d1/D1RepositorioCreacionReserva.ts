import type {
  RepositorioCreacionReserva,
  ReservaManualNueva,
} from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RepositorioCreacionReserva implements RepositorioCreacionReserva {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async contarSolapamientos(
    alojamientoId: number,
    fechaCheckin: string,
    fechaCheckout: string
  ): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM reservas
         WHERE alojamiento_id = ? AND estado IN ('pendiente', 'confirmada')
         AND fecha_checkin < ? AND fecha_checkout > ?`
      )
      .bind(alojamientoId, fechaCheckout, fechaCheckin)
      .first();

    return Number(row?.n) || 0;
  }

  async crearManual(reserva: ReservaManualNueva): Promise<{ id: number | undefined }> {
    const row = await this.db
      .prepare(
        `INSERT INTO reservas
          (cliente_nombre, cliente_telefono, cliente_email, alojamiento_id, fecha_checkin, fecha_checkout, cantidad_personas, monto_total, monto_sena, estado, canal_origen, tipo_estadia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`
      )
      .bind(
        reserva.clienteNombre,
        reserva.clienteTelefono,
        reserva.clienteEmail,
        reserva.alojamientoId,
        reserva.fechaCheckin,
        reserva.fechaCheckout,
        reserva.cantidadPersonas,
        reserva.montoTotal,
        reserva.montoSena,
        reserva.estado,
        reserva.canalOrigen,
        reserva.tipoEstadia
      )
      .first();

    return { id: row?.id === undefined ? undefined : Number(row.id) };
  }
}
