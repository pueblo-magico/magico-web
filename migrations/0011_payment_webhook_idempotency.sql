-- WRESERV-2 / WRESERV-13: observaciones externas e idempotencia de pagos.

CREATE UNIQUE INDEX idx_pagos_proveedor_preferencia_unique
  ON pagos (proveedor, external_preference_id)
  WHERE external_preference_id IS NOT NULL AND trim(external_preference_id) <> '';

CREATE TABLE pago_eventos_externos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  proveedor             TEXT NOT NULL,
  evento_externo_id     TEXT NOT NULL,
  external_payment_id   TEXT NOT NULL,
  reserva_id            INTEGER REFERENCES reservas(id) ON DELETE RESTRICT,
  estado_externo        TEXT,
  resultado             TEXT NOT NULL CHECK (resultado IN (
                            'recibido', 'aplicado', 'sin_cambios', 'inconsistente'
                          )),
  motivo_codigo         TEXT,
  monto_centavos        INTEGER CHECK (monto_centavos IS NULL OR monto_centavos >= 0),
  moneda                TEXT CHECK (moneda IS NULL OR (length(moneda) = 3 AND moneda = upper(moneda))),
  correlation_id        TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at          TEXT,
  UNIQUE (proveedor, evento_externo_id)
);

CREATE INDEX idx_pago_eventos_pago_created_at
  ON pago_eventos_externos (proveedor, external_payment_id, created_at);
CREATE INDEX idx_pago_eventos_reserva_created_at
  ON pago_eventos_externos (reserva_id, created_at);

-- La proyección de compatibilidad debe conservar el estado de rechazo explícito.
DROP TRIGGER reservas_cancelacion_proyectar;
CREATE TRIGGER reservas_cancelacion_proyectar
AFTER UPDATE OF estado ON reservas
WHEN OLD.estado <> 'cancelada' AND NEW.estado = 'cancelada'
BEGIN
  UPDATE reservas SET estado_flujo = CASE
    WHEN NEW.estado_flujo = 'vencida' THEN 'vencida'
    WHEN NEW.estado_flujo = 'rechazada' THEN 'rechazada'
    ELSE 'cancelada' END
  WHERE id = NEW.id;
  UPDATE retenciones_reserva SET estado = 'liberada',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE reserva_id = NEW.id AND estado = 'activa';
  UPDATE ocupacion_reserva_noches SET estado = 'liberada'
  WHERE reserva_estadia_id IN (SELECT id FROM reserva_estadias WHERE reserva_id = NEW.id)
    AND estado = 'retenida';
  INSERT INTO reserva_eventos (reserva_id, tipo, actor_tipo, actor_ref, payload_json)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.estado_flujo = 'vencida' THEN 'reserva.vencida'
      WHEN NEW.estado_flujo = 'rechazada' THEN 'reserva.pago_rechazado'
      ELSE 'reserva.cancelada' END,
    'servicio', 'procesamiento_pago', '{}'
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0011', 'webhooks de pago idempotentes y verificables',
        'migrations/0011_payment_webhook_idempotency.sql');
