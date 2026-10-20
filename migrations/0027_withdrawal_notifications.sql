-- WRESERV-43: comunicación trazable del derecho de arrepentimiento.
-- La cola general recibe sólo referencias opacas; el email se entrega únicamente
-- a un consumidor autenticado que reclama una notificación concreta.

ALTER TABLE solicitudes_arrepentimiento ADD COLUMN idioma TEXT NOT NULL DEFAULT 'es'
  CHECK (idioma IN ('es', 'en'));
ALTER TABLE solicitudes_arrepentimiento ADD COLUMN mensaje_cliente TEXT;
ALTER TABLE solicitudes_arrepentimiento ADD COLUMN version INTEGER NOT NULL DEFAULT 1
  CHECK (version > 0);

CREATE TABLE arrepentimiento_notificaciones (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  notificacion_uid      TEXT NOT NULL UNIQUE,
  dedupe_key            TEXT NOT NULL UNIQUE,
  solicitud_id          INTEGER NOT NULL REFERENCES solicitudes_arrepentimiento(id) ON DELETE RESTRICT,
  tipo                  TEXT NOT NULL CHECK (tipo IN (
                          'arrepentimiento_recibido', 'arrepentimiento_en_revision',
                          'arrepentimiento_resuelto', 'arrepentimiento_rechazado'
                        )),
  idioma                TEXT NOT NULL CHECK (idioma IN ('es', 'en')),
  estado                TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'procesando', 'entregada', 'dead_letter')),
  attempts              INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  claim_uid             TEXT,
  claimed_at            TEXT,
  claim_expires_at      TEXT,
  last_error_code       TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at          TEXT
);

CREATE INDEX idx_arrepentimiento_notificaciones_dispatch
  ON arrepentimiento_notificaciones (estado, next_attempt_at, created_at);
CREATE INDEX idx_arrepentimiento_notificaciones_solicitud
  ON arrepentimiento_notificaciones (solicitud_id, created_at);

CREATE TABLE arrepentimiento_notificacion_intentos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  notificacion_uid      TEXT NOT NULL
                        REFERENCES arrepentimiento_notificaciones(notificacion_uid) ON DELETE RESTRICT,
  delivery_uid          TEXT NOT NULL UNIQUE,
  resultado             TEXT NOT NULL CHECK (resultado IN ('entregada', 'retry', 'dead_letter')),
  error_code            TEXT,
  started_at            TEXT NOT NULL,
  completed_at          TEXT NOT NULL
);

CREATE TRIGGER solicitud_arrepentimiento_notificacion_recibida
AFTER INSERT ON solicitudes_arrepentimiento
BEGIN
  INSERT OR IGNORE INTO arrepentimiento_notificaciones (
    notificacion_uid, dedupe_key, solicitud_id, tipo, idioma
  ) VALUES (
    'notificacion:' || NEW.codigo || ':recibida:1',
    NEW.codigo || ':recibida:1', NEW.id, 'arrepentimiento_recibido', NEW.idioma
  );
END;

CREATE TRIGGER solicitud_arrepentimiento_notificacion_estado
AFTER UPDATE OF estado ON solicitudes_arrepentimiento
WHEN NEW.estado <> OLD.estado
BEGIN
  INSERT OR IGNORE INTO arrepentimiento_notificaciones (
    notificacion_uid, dedupe_key, solicitud_id, tipo, idioma
  ) VALUES (
    'notificacion:' || NEW.codigo || ':' || NEW.estado || ':' || NEW.version,
    NEW.codigo || ':' || NEW.estado || ':' || NEW.version,
    NEW.id,
    CASE NEW.estado
      WHEN 'en_revision' THEN 'arrepentimiento_en_revision'
      WHEN 'resuelta' THEN 'arrepentimiento_resuelto'
      ELSE 'arrepentimiento_rechazado'
    END,
    NEW.idioma
  );
END;

CREATE TRIGGER arrepentimiento_notificacion_to_outbox
AFTER INSERT ON arrepentimiento_notificaciones
BEGIN
  INSERT OR IGNORE INTO integration_outbox (
    event_id, event_type, schema_version, aggregate_type, aggregate_id,
    payload_json, occurred_at
  ) VALUES (
    NEW.notificacion_uid,
    'arrepentimiento.notificacion_pendiente',
    1,
    'arrepentimiento_notificacion',
    NEW.notificacion_uid,
    json_object(
      'event_id', NEW.notificacion_uid,
      'event_type', 'arrepentimiento.notificacion_pendiente',
      'schema_version', 1,
      'aggregate_type', 'arrepentimiento_notificacion',
      'aggregate_id', NEW.notificacion_uid,
      'notification_id', NEW.notificacion_uid,
      'intent_type', NEW.tipo,
      'language', NEW.idioma,
      'occurred_at', NEW.created_at
    ),
    NEW.created_at
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0027', 'notificaciones trazables de arrepentimiento',
        'migrations/0027_withdrawal_notifications.sql');
