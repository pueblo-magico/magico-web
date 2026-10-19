import type { RepositorioPagosManualesReserva } from '../../_application/reservas/ports.ts';
import type {
  RegistroPagoManual,
  ResumenPagoManual,
} from '../../_domain/reservas/manualPayments.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

type ContextoPago = {
  id: number;
  version: number;
  estadoFlujo: string;
  totalCentavos: number;
  senaCentavos: number;
  pagadoCentavos: number;
  moneda: string;
};

const PAGO_NETO_SQL = `COALESCE(SUM(CASE
  WHEN p.estado = 'aprobado' AND p.tipo = 'devolucion' THEN -p.monto_centavos
  WHEN p.estado = 'aprobado' THEN p.monto_centavos
  ELSE 0 END), 0)`;

export class D1RepositorioPagosManualesReserva implements RepositorioPagosManualesReserva {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private async contexto(reservaId: number): Promise<ContextoPago | null> {
    const row = await this.db.prepare(`
      SELECT r.id, r.version, r.estado_flujo,
        COALESCE(r.monto_total_centavos, CAST(round(r.monto_total * 100) AS INTEGER), 0) total_centavos,
        COALESCE(r.monto_sena_centavos, CAST(round(r.monto_sena * 100) AS INTEGER), 0) sena_centavos,
        r.moneda, ${PAGO_NETO_SQL} pagado_centavos
      FROM reservas r
      LEFT JOIN pagos p ON p.reserva_id = r.id
      WHERE r.id = ?
      GROUP BY r.id
    `).bind(reservaId).first();
    if (!row) return null;
    return {
      id: Number(row.id),
      version: Number(row.version),
      estadoFlujo: String(row.estado_flujo),
      totalCentavos: Number(row.total_centavos),
      senaCentavos: Number(row.sena_centavos),
      pagadoCentavos: Math.max(0, Number(row.pagado_centavos)),
      moneda: String(row.moneda || 'ARS'),
    };
  }

  private async existente(idempotencyKey: string): Promise<{ id: number; reservaId: number } | null> {
    const row = await this.db.prepare(`
      SELECT id, reserva_id FROM pagos
      WHERE proveedor = 'manual' AND idempotency_key = ?
    `).bind(idempotencyKey).first();
    return row ? { id: Number(row.id), reservaId: Number(row.reserva_id) } : null;
  }

  private async resultado(
    pagoId: number,
    reservaId: number,
    reservaConfirmada: boolean
  ): Promise<ResumenPagoManual | null> {
    const contexto = await this.contexto(reservaId);
    if (!contexto) return null;
    return {
      pagoId,
      reservaId,
      reservaVersion: contexto.version,
      estadoReserva: contexto.estadoFlujo,
      reservaConfirmada,
      totalCentavos: contexto.totalCentavos,
      pagadoCentavos: contexto.pagadoCentavos,
      saldoCentavos: Math.max(0, contexto.totalCentavos - contexto.pagadoCentavos),
      moneda: contexto.moneda,
    };
  }

  async registrar(entrada: RegistroPagoManual): Promise<ResumenPagoManual | null> {
    const duplicado = await this.existente(entrada.idempotencyKey);
    if (duplicado) {
      if (duplicado.reservaId !== entrada.reservaId) return null;
      return this.resultado(duplicado.id, duplicado.reservaId, false);
    }

    const contexto = await this.contexto(entrada.reservaId);
    if (!contexto || contexto.version !== entrada.expectedVersion ||
        !['pendiente_pago', 'confirmada'].includes(contexto.estadoFlujo) ||
        contexto.moneda !== entrada.moneda) return null;

    const saldoAntes = Math.max(0, contexto.totalCentavos - contexto.pagadoCentavos);
    if (entrada.montoCentavos > saldoAntes || saldoAntes === 0) return null;

    const pagadoDespues = contexto.pagadoCentavos + entrada.montoCentavos;
    const confirmarReserva = contexto.estadoFlujo === 'pendiente_pago' &&
      pagadoDespues >= contexto.senaCentavos;
    const nuevaVersion = contexto.version + 1;
    const eventoUid = `pago:manual:${entrada.idempotencyKey}`;
    const metadata = JSON.stringify({
      origen: 'admin_manual', metodo: entrada.metodo, referencia: entrada.referencia,
      motivo: entrada.motivo, registrado_por: entrada.actorEmail,
    });

    await this.db.batch([
      this.db.prepare(`
        INSERT INTO pagos (
          reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
          idempotency_key, metadata_json, correlation_id, provider_status,
          metodo_registro, referencia_manual, pagado_at, registrado_por,
          created_at, updated_at
        )
        SELECT id, 'manual', ?, 'aprobado', ?, ?, ?, ?, ?, 'manual_verified',
          ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        FROM reservas
        WHERE id = ? AND version = ? AND estado_flujo IN ('pendiente_pago', 'confirmada')
          AND NOT EXISTS (
            SELECT 1 FROM pagos WHERE proveedor = 'manual' AND idempotency_key = ?
          )
      `).bind(
        entrada.tipo, entrada.montoCentavos, entrada.moneda,
        entrada.idempotencyKey, metadata, entrada.correlationId,
        entrada.metodo, entrada.referencia, entrada.pagadoAt, entrada.actorEmail,
        entrada.reservaId, entrada.expectedVersion, entrada.idempotencyKey
      ),
      this.db.prepare(`
        UPDATE reservas SET
          estado = CASE WHEN ? THEN 'confirmada' ELSE estado END,
          estado_flujo = CASE WHEN ? THEN 'confirmada' ELSE estado_flujo END,
          version = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND version = ? AND EXISTS (
          SELECT 1 FROM pagos WHERE proveedor = 'manual' AND idempotency_key = ?
        )
      `).bind(
        confirmarReserva ? 1 : 0, confirmarReserva ? 1 : 0, nuevaVersion,
        entrada.reservaId, entrada.expectedVersion, entrada.idempotencyKey
      ),
      this.db.prepare(`
        UPDATE reserva_metodos_pago
        SET estado = 'confirmado', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_id = ? AND ? = 1 AND EXISTS (
          SELECT 1 FROM pagos WHERE proveedor = 'manual' AND idempotency_key = ?
        )
      `).bind(entrada.reservaId, confirmarReserva ? 1 : 0, entrada.idempotencyKey),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        )
        SELECT ?, 'pago.aprobado', 'usuario', ?, ?,
          json_object('origen', 'admin_manual', 'tipo', ?, 'metodo', ?,
            'monto_centavos', ?, 'moneda', ?),
          ?, 1, 'pago', CAST(id AS TEXT)
        FROM pagos WHERE proveedor = 'manual' AND idempotency_key = ?
      `).bind(
        entrada.reservaId, entrada.actorEmail, entrada.correlationId,
        entrada.tipo, entrada.metodo, entrada.montoCentavos, entrada.moneda,
        eventoUid, entrada.idempotencyKey
      ),
      this.db.prepare(`
        INSERT INTO auditoria_admin (
          email, accion, detalle, actor_tipo, entidad_tipo, entidad_id,
          motivo, correlation_id, metadata_json
        ) SELECT ?, 'registrar_pago_reserva', ?, 'usuario', 'reserva', ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM pagos WHERE proveedor = 'manual' AND idempotency_key = ?
        )
      `).bind(
        entrada.actorEmail,
        `Pago manual ${entrada.tipo} por ${entrada.montoCentavos} ${entrada.moneda}`,
        String(entrada.reservaId), entrada.motivo, entrada.correlationId,
        JSON.stringify({
          tipo: entrada.tipo, metodo: entrada.metodo, monto_centavos: entrada.montoCentavos,
          moneda: entrada.moneda, referencia: entrada.referencia, pagado_at: entrada.pagadoAt,
        }),
        entrada.idempotencyKey
      ),
    ]);

    const creado = await this.existente(entrada.idempotencyKey);
    if (!creado || creado.reservaId !== entrada.reservaId) return null;
    return this.resultado(creado.id, creado.reservaId, confirmarReserva);
  }
}
