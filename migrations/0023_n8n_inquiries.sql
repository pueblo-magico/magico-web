-- WRESERV-3 / WRESERV-18: consultas idempotentes y trazables desde n8n.

ALTER TABLE consultas ADD COLUMN cliente_email TEXT;
ALTER TABLE consultas ADD COLUMN canal_origen TEXT;
ALTER TABLE consultas ADD COLUMN consulta_uid TEXT;
ALTER TABLE consultas ADD COLUMN codigo TEXT;
ALTER TABLE consultas ADD COLUMN cotizacion_id INTEGER REFERENCES cotizaciones(id) ON DELETE RESTRICT;
ALTER TABLE consultas ADD COLUMN updated_at TEXT;

UPDATE consultas
SET consulta_uid = printf('legacy-consulta-%012d', id),
    codigo = printf('CON-%08d', id),
    canal_origen = CASE WHEN subscriber_id IS NOT NULL THEN 'ManyChat' ELSE 'Legacy' END,
    updated_at = created_at
WHERE consulta_uid IS NULL;

CREATE UNIQUE INDEX idx_consultas_uid ON consultas (consulta_uid);
CREATE UNIQUE INDEX idx_consultas_codigo ON consultas (codigo);
CREATE INDEX idx_consultas_cotizacion ON consultas (cotizacion_id);

CREATE TABLE consulta_integracion_referencias (
  consulta_id       INTEGER NOT NULL REFERENCES consultas(id) ON DELETE RESTRICT,
  integracion       TEXT NOT NULL CHECK (length(trim(integracion)) BETWEEN 1 AND 40),
  contacto_ref      TEXT NOT NULL CHECK (length(trim(contacto_ref)) BETWEEN 1 AND 200),
  conversacion_ref  TEXT CHECK (conversacion_ref IS NULL OR length(trim(conversacion_ref)) BETWEEN 1 AND 200),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (consulta_id, integracion)
);

CREATE INDEX idx_consulta_integracion_contacto
  ON consulta_integracion_referencias (integracion, contacto_ref, created_at);
CREATE INDEX idx_consulta_integracion_conversacion
  ON consulta_integracion_referencias (integracion, conversacion_ref)
  WHERE conversacion_ref IS NOT NULL;

ALTER TABLE reserva_integracion_referencias
  ADD COLUMN consulta_id INTEGER REFERENCES consultas(id) ON DELETE RESTRICT;
CREATE INDEX idx_reserva_integracion_consulta
  ON reserva_integracion_referencias (consulta_id)
  WHERE consulta_id IS NOT NULL;

ALTER TABLE solicitudes_idempotentes
  ADD COLUMN consulta_id INTEGER REFERENCES consultas(id) ON DELETE RESTRICT;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0023', 'consultas idempotentes y trazables desde n8n',
        'migrations/0023_n8n_inquiries.sql');
