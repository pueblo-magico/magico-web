-- WRESERV-1 / WRESERV-9
-- Controles persistentes de seguridad, auditoría estructurada y ciclo de PII.
PRAGMA foreign_keys = ON;

CREATE TABLE rate_limit_counters (
  bucket_hash   TEXT NOT NULL,
  ruta          TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  cantidad      INTEGER NOT NULL CHECK (cantidad > 0),
  expires_at    INTEGER NOT NULL,
  PRIMARY KEY (bucket_hash, ruta, window_start)
);
CREATE INDEX idx_rate_limit_expiration ON rate_limit_counters (expires_at);
CREATE TRIGGER rate_limit_cleanup_expired
AFTER INSERT ON rate_limit_counters
BEGIN
  DELETE FROM rate_limit_counters WHERE expires_at < NEW.window_start;
END;

ALTER TABLE auditoria_admin ADD COLUMN actor_tipo TEXT NOT NULL DEFAULT 'usuario'
  CHECK (actor_tipo IN ('usuario', 'servicio', 'sistema'));
ALTER TABLE auditoria_admin ADD COLUMN entidad_tipo TEXT;
ALTER TABLE auditoria_admin ADD COLUMN entidad_id TEXT;
ALTER TABLE auditoria_admin ADD COLUMN motivo TEXT;
ALTER TABLE auditoria_admin ADD COLUMN correlation_id TEXT;
ALTER TABLE auditoria_admin ADD COLUMN metadata_json TEXT
  CHECK (metadata_json IS NULL OR json_valid(metadata_json));

-- `detalle` legacy podía contener nombre/email/teléfono o valores editados.
-- La acción y el actor se conservan; el texto libre se elimina una sola vez.
UPDATE auditoria_admin SET detalle = NULL WHERE detalle IS NOT NULL;

CREATE INDEX idx_auditoria_entidad
  ON auditoria_admin (entidad_tipo, entidad_id, created_at);
CREATE INDEX idx_auditoria_correlation
  ON auditoria_admin (correlation_id)
  WHERE correlation_id IS NOT NULL;

CREATE TABLE solicitudes_datos_personales (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id      INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('exportacion', 'anonimizacion')),
  estado          TEXT NOT NULL CHECK (estado IN ('completada', 'rechazada')),
  actor_email     TEXT NOT NULL,
  motivo          TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_solicitudes_pii_reserva
  ON solicitudes_datos_personales (reserva_id, created_at);

CREATE TABLE politicas_retencion_datos (
  categoria       TEXT PRIMARY KEY,
  plazo_dias      INTEGER CHECK (plazo_dias IS NULL OR plazo_dias > 0),
  fundamento      TEXT,
  estado          TEXT NOT NULL DEFAULT 'pendiente_configuracion'
                    CHECK (estado IN ('pendiente_configuracion', 'activa')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (estado = 'pendiente_configuracion' OR (plazo_dias IS NOT NULL AND fundamento IS NOT NULL))
);

INSERT INTO politicas_retencion_datos (categoria)
VALUES ('datos_huespedes'), ('auditoria'), ('logs'), ('backups');

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0005', 'seguridad RBAC, límites y ciclo de datos personales', 'migrations/0005_security_rbac_pii.sql');
