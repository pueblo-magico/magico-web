-- WRESERV-2 / WRESERV-32: intento auditable de asignación de alias Cucuru.

ALTER TABLE cuenta_cobro_intentos RENAME TO cuenta_cobro_intentos_legacy;

CREATE TABLE cuenta_cobro_intentos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_cobro_id       INTEGER NOT NULL REFERENCES cuentas_cobro_reserva(id) ON DELETE RESTRICT,
  operacion_uid         TEXT NOT NULL UNIQUE,
  tipo                  TEXT NOT NULL CHECK (tipo IN ('lookup', 'create', 'alias')),
  resultado             TEXT NOT NULL CHECK (resultado IN (
                            'started', 'succeeded', 'not_found', 'failed', 'unknown_outcome'
                          )),
  external_request_id   TEXT,
  error_codigo          TEXT,
  started_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at          TEXT
);

INSERT INTO cuenta_cobro_intentos (
  id, cuenta_cobro_id, operacion_uid, tipo, resultado,
  external_request_id, error_codigo, started_at, completed_at
)
SELECT
  id, cuenta_cobro_id, operacion_uid, tipo, resultado,
  external_request_id, error_codigo, started_at, completed_at
FROM cuenta_cobro_intentos_legacy;

DROP TABLE cuenta_cobro_intentos_legacy;

INSERT OR IGNORE INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0018', 'Intentos auditables para asignar alias de cuentas Cucuru', '0018_cucuru_account_aliases.sql');
