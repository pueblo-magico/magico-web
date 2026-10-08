import type {
  CheckoutReservaPublica,
  RepositorioCheckoutReservaPublica,
} from '../../_application/reservas/ports.ts';

type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};

type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
};

export class D1RepositorioCheckoutReservaPublica implements RepositorioCheckoutReservaPublica {
  private readonly db: Database;

  constructor(db: Database) { this.db = db; }

  async obtener(reservaId: number): Promise<CheckoutReservaPublica | null> {
    const row = await this.db.prepare(`
      SELECT r.id, r.codigo, r.estado_flujo, r.hold_expires_at,
             COALESCE(r.monto_sena_centavos, CAST(round(r.monto_sena * 100) AS INTEGER)) monto_sena_centavos,
             r.moneda,
             CASE WHEN json_extract(c.desglose_json, '$.tipo_alojamiento') = 'refugio'
               THEN 'refugio' ELSE 'domo' END tipo_alojamiento,
             p.external_preference_id,
             json_extract(p.metadata_json, '$.checkout_url') checkout_url
      FROM reservas r
      LEFT JOIN cotizaciones c ON c.id = r.cotizacion_id
      LEFT JOIN pagos p ON p.id = (
        SELECT id FROM pagos
        WHERE reserva_id = r.id AND proveedor = 'mercado_pago'
        ORDER BY id DESC LIMIT 1
      )
      WHERE r.id = ?
      LIMIT 1
    `).bind(reservaId).first();
    if (!row) return null;
    return {
      reservaId: Number(row.id),
      reservaCodigo: String(row.codigo),
      tipoAlojamiento: row.tipo_alojamiento === 'refugio' ? 'refugio' : 'domo',
      montoSenaCentavos: Number(row.monto_sena_centavos),
      moneda: String(row.moneda),
      estadoFlujo: String(row.estado_flujo),
      expiresAt: row.hold_expires_at ? String(row.hold_expires_at) : null,
      preferenciaId: row.external_preference_id ? String(row.external_preference_id) : null,
      checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
    };
  }

  async reclamarProvisionamiento(reservaId: number): Promise<boolean> {
    const creada = await this.db.prepare(`
      INSERT INTO pagos (
        reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
        idempotency_key, metadata_json
      )
      SELECT id, 'mercado_pago', 'sena', 'pendiente',
             COALESCE(monto_sena_centavos, CAST(round(monto_sena * 100) AS INTEGER)),
             moneda, 'checkout:reserva:' || id,
             json_object('estado_checkout', 'provisionando')
      FROM reservas WHERE id = ?
      ON CONFLICT DO NOTHING
      RETURNING id
    `).bind(reservaId).first();
    if (creada) return true;

    const recuperada = await this.db.prepare(`
      UPDATE pagos
      SET metadata_json = json_set(
            COALESCE(metadata_json, '{}'),
            '$.estado_checkout', 'provisionando',
            '$.ultimo_error_codigo', NULL
          ),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE reserva_id = ? AND proveedor = 'mercado_pago'
        AND idempotency_key = 'checkout:reserva:' || ?
        AND external_preference_id IS NULL
        AND (
          json_extract(metadata_json, '$.estado_checkout') = 'fallido'
          OR updated_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 minute')
        )
      RETURNING id
    `).bind(reservaId, reservaId).first();
    return Boolean(recuperada);
  }

  async guardarPreferencia(
    reservaId: number,
    preferenciaId: string,
    checkoutUrl: string,
    correlationId: string
  ): Promise<void> {
    await this.db.batch([
      this.db.prepare(`
        UPDATE reservas
        SET mp_preference_id = ?
        WHERE id = ? AND (mp_preference_id IS NULL OR mp_preference_id = ?)
      `).bind(preferenciaId, reservaId, preferenciaId),
      this.db.prepare(`
        UPDATE pagos
        SET external_preference_id = ?,
            metadata_json = json_set(
              COALESCE(metadata_json, '{}'),
              '$.estado_checkout', 'listo',
              '$.checkout_url', ?,
              '$.ultimo_error_codigo', NULL
            ),
            correlation_id = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE reserva_id = ? AND proveedor = 'mercado_pago'
      `).bind(preferenciaId, checkoutUrl, correlationId, reservaId),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        ) VALUES (?, 'pago.preferencia_creada', 'servicio', 'mercado_pago', ?,
          json_object('proveedor', 'mercado_pago', 'preferencia_id', ?),
          ?, 1, 'pago', ?)
        ON CONFLICT DO NOTHING
      `).bind(
        reservaId,
        correlationId,
        preferenciaId,
        `pago:mercado_pago:preferencia:${preferenciaId}`,
        preferenciaId
      ),
    ]);
  }

  async registrarFallo(reservaId: number, codigo: string): Promise<void> {
    await this.db.prepare(`
      UPDATE pagos
      SET metadata_json = json_set(
            COALESCE(metadata_json, '{}'),
            '$.estado_checkout', 'fallido',
            '$.ultimo_error_codigo', ?
          ),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE reserva_id = ? AND proveedor = 'mercado_pago'
        AND external_preference_id IS NULL
    `).bind(codigo, reservaId).run();
  }
}
