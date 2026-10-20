-- WRESERV-3 / WRESERV-19: outbox transaccional y deduplicación de consumidores.

CREATE TABLE integration_outbox (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id              TEXT NOT NULL UNIQUE,
  event_type            TEXT NOT NULL,
  schema_version        INTEGER NOT NULL CHECK (schema_version > 0),
  aggregate_type        TEXT NOT NULL,
  aggregate_id          TEXT NOT NULL,
  payload_json          TEXT NOT NULL CHECK (json_valid(payload_json)),
  estado                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (estado IN ('pending', 'processing', 'delivered', 'dead_letter')),
  attempts              INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  claim_uid             TEXT,
  claimed_at            TEXT,
  claim_expires_at      TEXT,
  last_error_code       TEXT,
  occurred_at           TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at          TEXT
);

CREATE INDEX idx_integration_outbox_dispatch
  ON integration_outbox (estado, next_attempt_at, created_at);
CREATE INDEX idx_integration_outbox_claim
  ON integration_outbox (claim_expires_at)
  WHERE estado = 'processing';

CREATE TABLE integration_outbox_attempts (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id              TEXT NOT NULL REFERENCES integration_outbox(event_id) ON DELETE RESTRICT,
  delivery_uid          TEXT NOT NULL UNIQUE,
  consumer              TEXT NOT NULL,
  resultado             TEXT NOT NULL CHECK (resultado IN ('delivered', 'retry', 'dead_letter')),
  error_code            TEXT,
  started_at            TEXT NOT NULL,
  completed_at          TEXT NOT NULL
);

CREATE INDEX idx_integration_outbox_attempt_event
  ON integration_outbox_attempts (event_id, started_at);

CREATE TABLE integration_processed_events (
  consumer              TEXT NOT NULL,
  event_id              TEXT NOT NULL,
  processed_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (consumer, event_id)
);

CREATE TRIGGER reserva_eventos_to_integration_outbox
AFTER INSERT ON reserva_eventos
BEGIN
  INSERT OR IGNORE INTO integration_outbox (
    event_id, event_type, schema_version, aggregate_type, aggregate_id,
    payload_json, occurred_at
  ) VALUES (
    COALESCE(NULLIF(trim(NEW.evento_uid), ''), printf('reserva-evento:%d', NEW.id)),
    NEW.tipo,
    NEW.version,
    NEW.agregado_tipo,
    COALESCE(NEW.agregado_id, CAST(NEW.reserva_id AS TEXT)),
    json_object(
      'event_id', COALESCE(NULLIF(trim(NEW.evento_uid), ''), printf('reserva-evento:%d', NEW.id)),
      'event_type', NEW.tipo,
      'schema_version', NEW.version,
      'aggregate_type', NEW.agregado_tipo,
      'aggregate_id', COALESCE(NEW.agregado_id, CAST(NEW.reserva_id AS TEXT)),
      'reservation_id', NEW.reserva_id,
      'occurred_at', NEW.created_at
    ),
    NEW.created_at
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0021', 'outbox transaccional y deduplicacion de consumidores',
        'migrations/0021_integration_outbox.sql');
