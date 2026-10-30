-- Webhook Cucuru para aportes a la campaña de reforestación.
-- Aplicar una sola vez en D1 antes de activar el webhook en producción.

CREATE TABLE IF NOT EXISTS cucuru_webhook_eventos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id       TEXT NOT NULL UNIQUE,
  collector_id        TEXT NOT NULL,
  customer_id         TEXT,
  collection_account  TEXT,
  amount_cents        INTEGER NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL CHECK (length(currency) = 3 AND currency = upper(currency)),
  occurred_at         TEXT NOT NULL,
  payload_hash        TEXT NOT NULL CHECK (length(payload_hash) = 64),
  resultado           TEXT NOT NULL CHECK (resultado IN ('recibido', 'aplicado', 'revision_manual')),
  motivo_codigo       TEXT,
  request_id          TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_cucuru_webhook_resultado
  ON cucuru_webhook_eventos (resultado, created_at);

CREATE TABLE IF NOT EXISTS reforestacion_aportes (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  cucuru_collection_id       TEXT NOT NULL UNIQUE
                               REFERENCES cucuru_webhook_eventos(collection_id) ON DELETE RESTRICT,
  amount_cents               INTEGER NOT NULL CHECK (amount_cents > 0),
  currency                   TEXT NOT NULL CHECK (length(currency) = 3 AND currency = upper(currency)),
  occurred_at                TEXT NOT NULL,
  customer_reference         TEXT,
  estado                     TEXT NOT NULL DEFAULT 'confirmado'
                               CHECK (estado IN ('confirmado', 'revertido')),
  notification_status        TEXT NOT NULL DEFAULT 'pendiente'
                               CHECK (notification_status IN ('pendiente', 'enviada', 'fallida')),
  notification_attempted_at  TEXT,
  created_at                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reforestacion_aportes_fecha
  ON reforestacion_aportes (occurred_at);

CREATE TABLE IF NOT EXISTS cucuru_revisiones_aporte (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_evento_id  INTEGER NOT NULL
                       REFERENCES cucuru_webhook_eventos(id) ON DELETE RESTRICT,
  motivo_codigo      TEXT NOT NULL,
  evidencia_hash     TEXT NOT NULL CHECK (length(evidencia_hash) = 64),
  estado             TEXT NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente', 'resuelta', 'descartada')),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at        TEXT,
  UNIQUE (webhook_evento_id, motivo_codigo, evidencia_hash)
);

CREATE INDEX IF NOT EXISTS idx_cucuru_revisiones_estado
  ON cucuru_revisiones_aporte (estado, created_at);
