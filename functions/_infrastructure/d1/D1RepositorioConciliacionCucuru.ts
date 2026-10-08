import type {
  RepositorioConciliacionCucuru,
  ResultadoConciliacionCucuru,
} from '../../_application/reservas/ports.ts';

type Result = { results?: Record<string, unknown>[] };
type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  run(): Promise<unknown>;
};
type Database = {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<Result[]>;
};

export class D1RepositorioConciliacionCucuru implements RepositorioConciliacionCucuru {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async procesar(
    collection: Parameters<RepositorioConciliacionCucuru['procesar']>[0],
    correlationId: string
  ): Promise<ResultadoConciliacionCucuru> {
    const destinoPresente = collection.externalAccountId != null ||
      collection.customerId != null || collection.cvu != null;
    const statements = [
      this.db.prepare(`
        INSERT INTO cucuru_observaciones_transferencia (
          collection_id, monto_centavos, moneda, occurred_at, payload_hash,
          resultado, correlation_id
        ) VALUES (?, ?, ?, ?, ?, 'recibido', ?)
        ON CONFLICT (collection_id) DO NOTHING
      `).bind(
        collection.collectionId, collection.montoCentavos, collection.moneda,
        collection.occurredAt, collection.payloadHash, correlationId
      ),
      this.db.prepare(`
        WITH candidata AS (
          SELECT c.id cuenta_id, c.reserva_id, r.estado_flujo, r.hold_expires_at,
            c.simulada,
            COALESCE(r.monto_sena_centavos, CAST(round(r.monto_sena * 100) AS INTEGER)) monto_esperado,
            r.moneda moneda_esperada
          FROM cuentas_cobro_reserva c
          JOIN reservas r ON r.id = c.reserva_id
          WHERE c.proveedor = 'cucuru' AND c.estado = 'ready' AND ? = 1
            AND (? IS NULL OR c.external_account_id = ?)
            AND (? IS NULL OR c.customer_id = ?)
            AND (? IS NULL OR c.cvu = ?)
          LIMIT 1
        )
        UPDATE cucuru_observaciones_transferencia
        SET cuenta_cobro_id = (SELECT cuenta_id FROM candidata),
            reserva_id = (SELECT reserva_id FROM candidata),
            simulada = COALESCE((SELECT simulada FROM candidata), 0),
            resultado = CASE
              WHEN monto_centavos = 0 THEN 'prueba_cero'
              WHEN NOT EXISTS (SELECT 1 FROM candidata) THEN 'revision_manual'
              WHEN (SELECT estado_flujo FROM candidata) <> 'pendiente_pago' THEN 'revision_manual'
              WHEN (SELECT hold_expires_at FROM candidata) IS NOT NULL
                AND occurred_at >= (SELECT hold_expires_at FROM candidata)
                THEN 'revision_manual'
              WHEN monto_centavos <> (SELECT monto_esperado FROM candidata) THEN 'revision_manual'
              WHEN moneda <> (SELECT moneda_esperada FROM candidata) THEN 'revision_manual'
              ELSE 'aplicado'
            END,
            motivo_codigo = CASE
              WHEN monto_centavos = 0 THEN 'PRUEBA_IMPORTE_CERO'
              WHEN NOT EXISTS (SELECT 1 FROM candidata) THEN 'CUENTA_DESCONOCIDA'
              WHEN (SELECT estado_flujo FROM candidata) <> 'pendiente_pago' THEN 'RESERVA_NO_PENDIENTE'
              WHEN (SELECT hold_expires_at FROM candidata) IS NOT NULL
                AND occurred_at >= (SELECT hold_expires_at FROM candidata)
                THEN 'PAGO_TARDIO'
              WHEN monto_centavos <> (SELECT monto_esperado FROM candidata) THEN 'MONTO_INCORRECTO'
              WHEN moneda <> (SELECT moneda_esperada FROM candidata) THEN 'MONEDA_INCORRECTA'
              ELSE NULL
            END,
            processed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE collection_id = ? AND resultado = 'recibido'
        RETURNING resultado, motivo_codigo, reserva_id
      `).bind(
        destinoPresente ? 1 : 0,
        collection.externalAccountId, collection.externalAccountId,
        collection.customerId, collection.customerId,
        collection.cvu, collection.cvu,
        collection.collectionId
      ),
      this.db.prepare(`
        INSERT OR IGNORE INTO cucuru_revisiones_pago (
          observacion_id, motivo_codigo, evidencia_hash
        )
        SELECT id, motivo_codigo, payload_hash
        FROM cucuru_observaciones_transferencia
        WHERE collection_id = ? AND resultado = 'revision_manual'
      `).bind(collection.collectionId),
      this.db.prepare(`
        INSERT OR IGNORE INTO pagos (
          reserva_id, proveedor, tipo, estado, monto_centavos, moneda,
          external_payment_id, idempotency_key, metadata_json,
          correlation_id, provider_status
        )
        SELECT reserva_id,
          CASE WHEN simulada = 1 THEN 'cucuru_mock' ELSE 'cucuru' END,
          'sena', 'aprobado', monto_centavos, moneda,
          collection_id, 'collection:' || collection_id,
          json_object('collection_id', collection_id, 'simulada', simulada),
          correlation_id, 'received'
        FROM cucuru_observaciones_transferencia
        WHERE collection_id = ? AND resultado = 'aplicado'
      `).bind(collection.collectionId),
      this.db.prepare(`
        UPDATE reservas
        SET estado = 'confirmada', estado_flujo = 'confirmada',
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = (
          SELECT reserva_id FROM cucuru_observaciones_transferencia
          WHERE collection_id = ? AND resultado = 'aplicado'
        ) AND estado_flujo = 'pendiente_pago'
      `).bind(collection.collectionId),
      this.db.prepare(`
        INSERT INTO pago_eventos_externos (
          proveedor, evento_externo_id, external_payment_id, reserva_id,
          estado_externo, resultado, motivo_codigo, monto_centavos, moneda,
          correlation_id, processed_at
        )
        SELECT CASE WHEN simulada = 1 THEN 'cucuru_mock' ELSE 'cucuru' END,
          collection_id, collection_id, reserva_id, 'received',
          CASE resultado
            WHEN 'aplicado' THEN 'aplicado'
            WHEN 'revision_manual' THEN 'inconsistente'
            ELSE 'sin_cambios' END,
          motivo_codigo, monto_centavos, moneda, correlation_id, processed_at
        FROM cucuru_observaciones_transferencia WHERE collection_id = ?
        ON CONFLICT (proveedor, evento_externo_id) DO NOTHING
      `).bind(collection.collectionId),
      this.db.prepare(`
        INSERT INTO reserva_eventos (
          reserva_id, tipo, actor_tipo, actor_ref, correlation_id, payload_json,
          evento_uid, version, agregado_tipo, agregado_id
        )
        SELECT reserva_id, 'pago.aprobado', 'servicio',
          CASE WHEN simulada = 1 THEN 'cucuru_mock' ELSE 'cucuru' END,
          correlation_id,
          json_object(
            'proveedor', CASE WHEN simulada = 1 THEN 'cucuru_mock' ELSE 'cucuru' END,
            'collection_id', collection_id, 'monto_centavos', monto_centavos,
            'moneda', moneda, 'simulada', simulada
          ),
          'pago:' || CASE WHEN simulada = 1 THEN 'cucuru_mock' ELSE 'cucuru' END ||
            ':' || collection_id || ':aprobado',
          1, 'pago', collection_id
        FROM cucuru_observaciones_transferencia
        WHERE collection_id = ? AND resultado = 'aplicado'
        ON CONFLICT DO NOTHING
      `).bind(collection.collectionId),
    ];
    const resultados = await this.db.batch(statements);
    const clasificada = resultados[1]?.results?.[0];
    if (!clasificada) {
      const existente = await this.db.prepare(`
        SELECT id, resultado, motivo_codigo, payload_hash
        FROM cucuru_observaciones_transferencia
        WHERE collection_id = ?
      `).bind(collection.collectionId).first();
      if (!existente) throw new Error('No se pudo persistir la observación de Cucuru.');
      if (String(existente.payload_hash) !== collection.payloadHash) {
        await this.db.prepare(`
          INSERT OR IGNORE INTO cucuru_revisiones_pago (
            observacion_id, motivo_codigo, evidencia_hash
          ) VALUES (?, 'DUPLICADO_INCONSISTENTE', ?)
        `).bind(existente.id, collection.payloadHash).run();
        return {
          estado: 'revision_manual',
          motivoCodigo: 'DUPLICADO_INCONSISTENTE',
          reserva: null,
        };
      }
      return {
        estado: 'duplicado',
        motivoCodigo: existente.motivo_codigo == null ? null : String(existente.motivo_codigo),
        reserva: null,
      };
    }

    const estado = String(clasificada.resultado) as ResultadoConciliacionCucuru['estado'];
    let reserva = null;
    if (estado === 'aplicado' && clasificada.reserva_id != null) {
      const row = await this.db.prepare(`
        SELECT manychat_user_id, fecha_checkin, fecha_checkout
        FROM reservas WHERE id = ? AND estado_flujo = 'confirmada'
      `).bind(clasificada.reserva_id).first();
      if (row) reserva = {
        manyChatUserId: row.manychat_user_id == null ? null : String(row.manychat_user_id),
        fechaCheckin: String(row.fecha_checkin),
        fechaCheckout: String(row.fecha_checkout),
      };
    }
    return {
      estado,
      motivoCodigo: clasificada.motivo_codigo == null ? null : String(clasificada.motivo_codigo),
      reserva,
    };
  }
}
