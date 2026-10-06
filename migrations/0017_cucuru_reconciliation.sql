-- WRESERV-2 / WRESERV-32: ledger de conciliación reanudable y revisión manual.

ALTER TABLE cucuru_observaciones_transferencia
  RENAME TO cucuru_observaciones_transferencia_v1;

CREATE TABLE cucuru_observaciones_transferencia (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id         TEXT NOT NULL UNIQUE,
  cuenta_cobro_id       INTEGER REFERENCES cuentas_cobro_reserva(id) ON DELETE RESTRICT,
  reserva_id            INTEGER REFERENCES reservas(id) ON DELETE RESTRICT,
  monto_centavos        INTEGER NOT NULL CHECK (monto_centavos >= 0),
  moneda                TEXT NOT NULL CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  occurred_at           TEXT NOT NULL,
  payload_hash          TEXT NOT NULL,
  resultado             TEXT NOT NULL CHECK (resultado IN (
                            'recibido', 'prueba_cero', 'aplicado',
                            'revision_manual', 'duplicado'
                          )),
  motivo_codigo         TEXT,
  correlation_id        TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at          TEXT
);

INSERT INTO cucuru_observaciones_transferencia (
  id, collection_id, cuenta_cobro_id, reserva_id, monto_centavos, moneda,
  occurred_at, payload_hash, resultado, motivo_codigo, correlation_id,
  created_at, processed_at
)
SELECT id, collection_id, cuenta_cobro_id, reserva_id, monto_centavos, moneda,
  occurred_at, payload_hash, resultado, motivo_codigo, correlation_id,
  created_at, processed_at
FROM cucuru_observaciones_transferencia_v1;

DROP TABLE cucuru_observaciones_transferencia_v1;

CREATE INDEX idx_cucuru_observacion_reserva
  ON cucuru_observaciones_transferencia (reserva_id, created_at);

CREATE TABLE cucuru_revisiones_pago (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  observacion_id        INTEGER NOT NULL REFERENCES cucuru_observaciones_transferencia(id) ON DELETE RESTRICT,
  motivo_codigo         TEXT NOT NULL,
  evidencia_hash        TEXT NOT NULL,
  estado                TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'resuelta', 'descartada')),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at           TEXT,
  UNIQUE (observacion_id, motivo_codigo, evidencia_hash)
);

CREATE INDEX idx_cucuru_revision_estado
  ON cucuru_revisiones_pago (estado, created_at);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0017', 'conciliacion y revision manual Cucuru',
        'migrations/0017_cucuru_reconciliation.sql');
