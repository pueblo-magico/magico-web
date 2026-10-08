-- Solicitudes públicas para ejercer el derecho de arrepentimiento.
-- Registrar una solicitud no cancela la reserva ni genera devoluciones automáticas.

CREATE TABLE solicitudes_arrepentimiento (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo                     TEXT NOT NULL UNIQUE,
  reserva_id                 INTEGER REFERENCES reservas(id) ON DELETE SET NULL,
  reserva_codigo_declarado   TEXT,
  email_contacto             TEXT NOT NULL,
  detalle                    TEXT NOT NULL,
  estado                     TEXT NOT NULL DEFAULT 'recibida'
                               CHECK (estado IN ('recibida', 'en_revision', 'resuelta', 'rechazada')),
  idempotency_key            TEXT NOT NULL UNIQUE,
  request_hash               TEXT NOT NULL,
  correlation_id             TEXT,
  created_at                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  acknowledged_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_at                TEXT,
  resolved_by                TEXT,
  resolution_note            TEXT
);

CREATE INDEX idx_solicitudes_arrepentimiento_estado
  ON solicitudes_arrepentimiento (estado, created_at);
CREATE INDEX idx_solicitudes_arrepentimiento_reserva
  ON solicitudes_arrepentimiento (reserva_id, created_at);

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0024', 'solicitudes públicas auditables de arrepentimiento',
        'migrations/0024_withdrawal_requests.sql');
