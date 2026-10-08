import type {
  ObservacionPagoReserva,
  PagoEsperadoReserva,
  RepositorioEstadoPagoReserva,
  ReservaConfirmadaParaNotificar,
} from '../../_application/reservas/ports.ts';
import type { EstadoPagoReserva } from '../../_domain/reservas/paymentLifecycle.ts';

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

type D1Database = {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
};

export class D1RepositorioEstadoPagoReserva implements RepositorioEstadoPagoReserva {
  private readonly db: D1Database;

  constructor(db: D1Database) { this.db = db; }

  async obtenerEsperado(reservaId: number): Promise<PagoEsperadoReserva | null> {
    const row = await this.db.prepare(`
      SELECT id, estado_flujo,
        COALESCE(monto_sena_centavos, CAST(round(monto_sena * 100) AS INTEGER)) monto_centavos,
        moneda, mp_preference_id
      FROM reservas WHERE id = ?
    `).bind(reservaId).first();
    if (!row) return null;
    return {
      reservaId: Number(row.id),
      estadoFlujo: String(row.estado_flujo),
      montoCentavos: Number(row.monto_centavos),
      moneda: String(row.moneda),
      preferenciaId: row.mp_preference_id ? String(row.mp_preference_id) : null,
    };
  }

  async obtenerEstadoPago(proveedor: string, externalPaymentId: string): Promise<EstadoPagoReserva | null> {
    const row = await this.db.prepare(`
      SELECT estado FROM pagos
      WHERE proveedor = ? AND external_payment_id = ?
    `).bind(proveedor, externalPaymentId).first();
    return row ? row.estado as EstadoPagoReserva : null;
  }

  async registrarObservacion(observacion: ObservacionPagoReserva): Promise<boolean> {
    const row = await this.db.prepare(`
      INSERT INTO pago_eventos_externos (
        proveedor, evento_externo_id, external_payment_id, reserva_id,
        estado_externo, resultado, motivo_codigo, monto_centavos, moneda,
        correlation_id, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT (proveedor, evento_externo_id) DO NOTHING
      RETURNING id
    `).bind(
      observacion.proveedor, observacion.eventoExternoId, observacion.pago.id,
      observacion.reservaId, observacion.pago.estado, observacion.resultado,
      observacion.motivoCodigo, observacion.pago.montoCentavos,
      observacion.pago.moneda, observacion.correlationId
    ).first();
    return Boolean(row);
  }

  async registrarPago(
    observacion: ObservacionPagoReserva,
    estado: EstadoPagoReserva
  ): Promise<void> {
    if (!observacion.reservaId) return;
    const monto = observacion.pago.montoCentavos ?? 0;
    const moneda = observacion.pago.moneda ?? 'ARS';
    const metadata = JSON.stringify({
      estado_externo: observacion.pago.estado,
      motivo_codigo: observacion.motivoCodigo,
      evento_externo_id: observacion.eventoExternoId,
    });
    const actualizar = this.db.prepare(`
      UPDATE pagos SET estado = ?, external_payment_id = ?,
        monto_centavos = CASE WHEN ? IS NULL THEN monto_centavos ELSE ? END,
        moneda = CASE WHEN ? IS NULL THEN moneda ELSE ? END,
        idempotency_key = COALESCE(idempotency_key, ?), metadata_json = ?,
        correlation_id = ?, provider_status = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE reserva_id = ? AND proveedor = ?
        AND (external_payment_id IS NULL OR external_payment_id = ?)
    `).bind(
      estado, observacion.pago.id,
      observacion.pago.montoCentavos, monto,
      observacion.pago.moneda, moneda,
      `payment:${observacion.pago.id}`, metadata,
      observacion.correlationId, observacion.pago.estado,
      observacion.reservaId, observacion.proveedor, observacion.pago.id
    );
    const insertar = this.db.prepare(`
      INSERT OR IGNORE INTO pagos (
        reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
        external_payment_id, idempotency_key, metadata_json,
        correlation_id, provider_status
      ) SELECT ?, ?, 'sena', ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM pagos WHERE proveedor = ? AND external_payment_id = ?
      )
    `).bind(
      observacion.reservaId, observacion.proveedor, estado, monto, moneda,
      observacion.pago.id, `payment:${observacion.pago.id}`, metadata,
      observacion.correlationId, observacion.pago.estado,
      observacion.proveedor, observacion.pago.id
    );
    const evento = this.db.prepare(`
      INSERT INTO reserva_eventos (
        reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
        evento_uid, version, agregado_tipo, agregado_id
      ) VALUES (?, ?, 'servicio', ?, ?, json_object(
          'proveedor', ?, 'external_payment_id', ?, 'estado', ?,
          'monto_centavos', ?, 'moneda', ?
        ), ?, 1, 'pago', ?)
      ON CONFLICT DO NOTHING
    `).bind(
      observacion.reservaId, `pago.${estado}`, observacion.proveedor,
      observacion.correlationId, observacion.proveedor, observacion.pago.id,
      estado, monto, moneda,
      `pago:${observacion.proveedor}:${observacion.pago.id}:${estado}`,
      observacion.pago.id
    );
    await this.db.batch([actualizar, insertar, evento]);
  }

  async confirmar(reservaId: number, pagoId: string): Promise<ReservaConfirmadaParaNotificar | null> {
    const row = await this.db
      .prepare(
        `UPDATE reservas SET estado = 'confirmada', estado_flujo = 'confirmada',
           mp_payment_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND estado_flujo = 'pendiente_pago'
           AND (hold_expires_at IS NULL OR hold_expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
      .prepare(`UPDATE reservas SET estado = 'cancelada', estado_flujo = 'rechazada',
         mp_payment_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND estado_flujo = 'pendiente_pago'`)
      .bind(pagoId, reservaId)
      .run();
  }
}
