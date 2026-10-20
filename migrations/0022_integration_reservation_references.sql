-- WRESERV-3 / WRESERV-18: referencias externas genéricas para comandos de n8n.

CREATE TABLE reserva_integracion_referencias (
  reserva_id        INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  integracion       TEXT NOT NULL CHECK (length(trim(integracion)) BETWEEN 1 AND 40),
  contacto_ref      TEXT NOT NULL CHECK (length(trim(contacto_ref)) BETWEEN 1 AND 200),
  conversacion_ref  TEXT CHECK (conversacion_ref IS NULL OR length(trim(conversacion_ref)) BETWEEN 1 AND 200),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (reserva_id, integracion)
);

CREATE INDEX idx_reserva_integracion_contacto
  ON reserva_integracion_referencias (integracion, contacto_ref, created_at);

CREATE INDEX idx_reserva_integracion_conversacion
  ON reserva_integracion_referencias (integracion, conversacion_ref)
  WHERE conversacion_ref IS NOT NULL;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0022', 'referencias externas de reservas creadas por integraciones',
        'migrations/0022_integration_reservation_references.sql');
