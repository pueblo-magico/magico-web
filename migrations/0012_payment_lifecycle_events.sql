-- WRESERV-2 / WRESERV-16: pagos correlacionados y eventos append-only.

ALTER TABLE pagos ADD COLUMN correlation_id TEXT;
ALTER TABLE pagos ADD COLUMN provider_status TEXT;

ALTER TABLE reserva_eventos ADD COLUMN evento_uid TEXT;
ALTER TABLE reserva_eventos ADD COLUMN version INTEGER NOT NULL DEFAULT 1
  CHECK (version > 0);
ALTER TABLE reserva_eventos ADD COLUMN agregado_tipo TEXT NOT NULL DEFAULT 'reserva'
  CHECK (agregado_tipo IN ('reserva', 'pago', 'asignacion', 'politica', 'integracion'));
ALTER TABLE reserva_eventos ADD COLUMN agregado_id TEXT;

UPDATE reserva_eventos
SET agregado_id = CAST(reserva_id AS TEXT)
WHERE agregado_id IS NULL;

CREATE UNIQUE INDEX idx_reserva_eventos_uid_unique
  ON reserva_eventos (evento_uid)
  WHERE evento_uid IS NOT NULL AND trim(evento_uid) <> '';
CREATE INDEX idx_reserva_eventos_correlation
  ON reserva_eventos (correlation_id, created_at)
  WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_pagos_correlation
  ON pagos (correlation_id, created_at)
  WHERE correlation_id IS NOT NULL;

CREATE TRIGGER reserva_eventos_append_only_update
BEFORE UPDATE ON reserva_eventos
BEGIN
  SELECT RAISE(ABORT, 'reserva_eventos es append-only');
END;

CREATE TRIGGER reserva_eventos_append_only_delete
BEFORE DELETE ON reserva_eventos
BEGIN
  SELECT RAISE(ABORT, 'reserva_eventos es append-only');
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0012', 'pagos correlacionados y eventos append-only',
        'migrations/0012_payment_lifecycle_events.sql');
