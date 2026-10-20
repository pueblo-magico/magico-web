// Registro de "quién hizo qué" desde el Panel de Reservas — alimenta la
// pestaña Actividad (solo super_admin). Ver functions/api/admin/actividad.ts.

export type EntradaAuditoria = {
  email: string;
  accion: string;
  entidadTipo?: string;
  entidadId?: string | number;
  motivo?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export async function registrarAuditoria(db: any, entrada: EntradaAuditoria): Promise<void> {
  await db
    .prepare(`INSERT INTO auditoria_admin
      (email, accion, detalle, actor_tipo, entidad_tipo, entidad_id, motivo, correlation_id, metadata_json)
      VALUES (?, ?, NULL, 'usuario', ?, ?, ?, ?, ?)`)
    .bind(
      entrada.email,
      entrada.accion,
      entrada.entidadTipo ?? null,
      entrada.entidadId == null ? null : String(entrada.entidadId),
      entrada.motivo ?? null,
      entrada.correlationId ?? null,
      entrada.metadata ? JSON.stringify(entrada.metadata) : null
    )
    .run();
}
