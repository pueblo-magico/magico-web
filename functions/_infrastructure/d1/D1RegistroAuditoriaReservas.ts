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

  async registrar(entrada: Parameters<RegistroAuditoriaReservas['registrar']>[0]): Promise<void> {
    await this.db
      .prepare(`INSERT INTO auditoria_admin
        (email, accion, detalle, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json)
        VALUES (?, ?, NULL, 'usuario', ?, ?, ?, ?, ?)`)
      .bind(
        entrada.email, entrada.accion, entrada.entidadTipo ?? null,
        entrada.entidadId == null ? null : String(entrada.entidadId),
        entrada.motivo ?? null, entrada.correlationId ?? null,
        entrada.metadata ? JSON.stringify(entrada.metadata) : null
      )
      .run();
  }
}
