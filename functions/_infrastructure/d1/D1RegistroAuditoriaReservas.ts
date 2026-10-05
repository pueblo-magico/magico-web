import type { RegistroAuditoriaReservas } from '../../_application/reservas/ports.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
};

type D1Database = {
  prepare(query: string): D1Statement;
};

export class D1RegistroAuditoriaReservas implements RegistroAuditoriaReservas {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async registrar(email: string, accion: string, detalle?: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO auditoria_admin (email, accion, detalle) VALUES (?, ?, ?)')
      .bind(email, accion, detalle ?? null)
      .run();
  }
}
