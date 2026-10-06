-- WRESERV-2 / WRESERV-32: cuentas de cobro por reserva y recuperación Cucuru.

CREATE TABLE cuentas_cobro_reserva (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id            INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  proveedor             TEXT NOT NULL CHECK (proveedor = 'cucuru'),
  customer_id           TEXT NOT NULL,
  estado                TEXT NOT NULL CHECK (estado IN (
                            'pending', 'provisioning', 'ready', 'failed',
                            'disabled', 'unknown_outcome'
                          )),
  external_account_id   TEXT,
  cvu                   TEXT,
  alias                 TEXT,
  moneda                TEXT NOT NULL DEFAULT 'ARS'
                          CHECK (length(moneda) = 3 AND moneda = upper(moneda)),
  intentos              INTEGER NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  ultima_operacion_uid  TEXT NOT NULL,
  ultimo_error_codigo   TEXT,
  next_retry_at         TEXT,
  last_attempt_at       TEXT,
  ready_at              TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (reserva_id, proveedor),
  UNIQUE (proveedor, customer_id),
  UNIQUE (proveedor, ultima_operacion_uid),
  CHECK (cvu IS NULL OR (length(cvu) = 22 AND cvu NOT GLOB '*[^0-9]*')),
  CHECK (estado <> 'ready' OR (external_account_id IS NOT NULL AND cvu IS NOT NULL))
);

CREATE UNIQUE INDEX idx_cuenta_cobro_external_account
  ON cuentas_cobro_reserva (proveedor, external_account_id)
  WHERE external_account_id IS NOT NULL;
CREATE UNIQUE INDEX idx_cuenta_cobro_cvu
  ON cuentas_cobro_reserva (proveedor, cvu)
  WHERE cvu IS NOT NULL;
CREATE INDEX idx_cuenta_cobro_retry
  ON cuentas_cobro_reserva (estado, next_retry_at)
  WHERE estado IN ('failed', 'unknown_outcome');

CREATE TABLE cuenta_cobro_intentos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_cobro_id       INTEGER NOT NULL REFERENCES cuentas_cobro_reserva(id) ON DELETE RESTRICT,
  operacion_uid         TEXT NOT NULL UNIQUE,
  tipo                  TEXT NOT NULL CHECK (tipo IN ('lookup', 'create')),
  resultado             TEXT NOT NULL CHECK (resultado IN (
                            'started', 'succeeded', 'not_found', 'failed', 'unknown_outcome'
                          )),
  external_request_id   TEXT,
  error_codigo          TEXT,
  started_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at          TEXT
);

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
                            'recibido', 'prueba_cero', 'aplicado', 'revision_manual'
                          )),
  motivo_codigo         TEXT,
  correlation_id        TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at          TEXT
);

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

CREATE TABLE cucuru_backfill_checkpoints (
  alcance               TEXT PRIMARY KEY,
  cursor                TEXT,
  window_start_at       TEXT,
  window_end_at         TEXT,
  lock_uid              TEXT,
  lock_expires_at       TEXT,
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0016', 'cuentas de cobro y recuperacion Cucuru',
        'migrations/0016_cucuru_collection_accounts.sql');
