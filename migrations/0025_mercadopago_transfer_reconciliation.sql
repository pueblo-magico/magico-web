-- WRESERV-44: elección de medio de pago y conciliación de transferencias por DNI.
-- El DNI completo no se persiste: sólo HMAC y últimos cuatro dígitos.

CREATE TABLE reserva_metodos_pago (
  reserva_id                  INTEGER PRIMARY KEY REFERENCES reservas(id) ON DELETE RESTRICT,
  metodo                      TEXT NOT NULL CHECK (metodo IN ('mercado_pago_checkout', 'transferencia_mp')),
  pagador_documento_tipo      TEXT CHECK (pagador_documento_tipo IS NULL OR pagador_documento_tipo = 'DNI'),
  pagador_documento_hash      TEXT,
  pagador_documento_ultimos4  TEXT,
  monto_esperado_centavos     INTEGER NOT NULL CHECK (monto_esperado_centavos > 0),
  moneda                      TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda = 'ARS'),
  estado                      TEXT NOT NULL DEFAULT 'pendiente'
                              CHECK (estado IN ('pendiente', 'confirmado', 'revision_manual')),
  created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (metodo = 'mercado_pago_checkout' AND pagador_documento_tipo IS NULL
      AND pagador_documento_hash IS NULL AND pagador_documento_ultimos4 IS NULL)
    OR
    (metodo = 'transferencia_mp' AND pagador_documento_tipo = 'DNI'
      AND length(pagador_documento_hash) = 64
      AND length(pagador_documento_ultimos4) = 4)
  )
);

CREATE INDEX idx_reserva_metodos_pago_conciliacion
  ON reserva_metodos_pago (
    metodo, pagador_documento_hash, monto_esperado_centavos, moneda, estado
  );

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0025', 'conciliacion de transferencias Mercado Pago por DNI protegido',
        'migrations/0025_mercadopago_transfer_reconciliation.sql');
