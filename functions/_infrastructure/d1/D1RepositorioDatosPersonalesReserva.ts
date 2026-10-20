import type {
  DatosPersonalesReserva,
  RepositorioDatosPersonalesReserva,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
};
type Database = { prepare(query: string): Statement };

export class D1RepositorioDatosPersonalesReserva implements RepositorioDatosPersonalesReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  obtener(reservaId: number): Promise<DatosPersonalesReserva | null> {
    return this.db.prepare(`
      SELECT id, codigo, cliente_nombre, cliente_telefono, cliente_email, manychat_user_id,
             fecha_checkin, fecha_checkout, cantidad_personas, estado, canal_origen, created_at, updated_at
      FROM reservas WHERE id = ?
    `).bind(reservaId).first<DatosPersonalesReserva>();
  }

  async anonimizar(reservaId: number): Promise<void> {
    await this.db.prepare(`
      UPDATE reservas
      SET cliente_nombre = 'Huésped anonimizado', cliente_telefono = NULL,
          cliente_email = NULL, manychat_user_id = NULL
      WHERE id = ?
    `).bind(reservaId).run();
  }

  async registrarSolicitud(entrada: Parameters<RepositorioDatosPersonalesReserva['registrarSolicitud']>[0]): Promise<void> {
    await this.db.prepare(`
      INSERT INTO solicitudes_datos_personales
        (reserva_id, tipo, estado, actor_email, motivo, correlation_id)
      VALUES (?, ?, 'completada', ?, ?, ?)
    `).bind(
      entrada.reservaId, entrada.tipo, entrada.actorEmail,
      entrada.motivo, entrada.correlationId
    ).run();
  }
}
