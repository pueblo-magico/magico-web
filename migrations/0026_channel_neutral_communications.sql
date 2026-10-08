-- WRESERV-3 / WRESERV-28: intenciones de comunicación independientes del canal.

ALTER TABLE reservas ADD COLUMN idioma_comunicacion TEXT NOT NULL DEFAULT 'es'
  CHECK (idioma_comunicacion IN ('es', 'en'));

CREATE TABLE comunicacion_plantillas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo            TEXT NOT NULL,
  intencion         TEXT NOT NULL CHECK (intencion IN (
                      'reserva_creada', 'pago_pendiente', 'pago_aprobado',
                      'reserva_vencida', 'reserva_modificada', 'reserva_cancelada'
                    )),
  idioma            TEXT NOT NULL CHECK (idioma IN ('es', 'en')),
  version           INTEGER NOT NULL CHECK (version > 0),
  estado            TEXT NOT NULL DEFAULT 'publicada'
                    CHECK (estado IN ('borrador', 'publicada', 'retirada')),
  asunto_template   TEXT NOT NULL,
  cuerpo_template   TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at      TEXT,
  UNIQUE (codigo, idioma, version)
);

CREATE UNIQUE INDEX idx_comunicacion_plantilla_publicada
  ON comunicacion_plantillas (intencion, idioma)
  WHERE estado = 'publicada';

CREATE TRIGGER comunicacion_plantilla_publicada_inmutable_update
BEFORE UPDATE ON comunicacion_plantillas
WHEN OLD.estado = 'publicada' AND NOT (
  NEW.estado = 'retirada'
  AND NEW.codigo = OLD.codigo
  AND NEW.intencion = OLD.intencion
  AND NEW.idioma = OLD.idioma
  AND NEW.version = OLD.version
  AND NEW.asunto_template = OLD.asunto_template
  AND NEW.cuerpo_template = OLD.cuerpo_template
  AND NEW.created_at = OLD.created_at
  AND NEW.published_at IS OLD.published_at
)
BEGIN SELECT RAISE(ABORT, 'plantilla de comunicacion publicada es inmutable'); END;

CREATE TRIGGER comunicacion_plantilla_publicada_inmutable_delete
BEFORE DELETE ON comunicacion_plantillas
WHEN OLD.estado = 'publicada'
BEGIN SELECT RAISE(ABORT, 'plantilla de comunicacion publicada es inmutable'); END;

CREATE TABLE comunicacion_intenciones (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  intencion_uid         TEXT NOT NULL UNIQUE,
  dedupe_key            TEXT NOT NULL UNIQUE,
  reserva_id            INTEGER NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  source_event_uid      TEXT NOT NULL,
  tipo                  TEXT NOT NULL CHECK (tipo IN (
                          'reserva_creada', 'pago_pendiente', 'pago_aprobado',
                          'reserva_vencida', 'reserva_modificada', 'reserva_cancelada'
                        )),
  idioma                TEXT NOT NULL CHECK (idioma IN ('es', 'en')),
  plantilla_codigo      TEXT NOT NULL,
  plantilla_version     INTEGER NOT NULL CHECK (plantilla_version > 0),
  estado                TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN (
                          'pendiente', 'procesando', 'entregada', 'sin_canal', 'dead_letter'
                        )),
  attempts              INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  claim_uid             TEXT,
  claimed_at            TEXT,
  claim_expires_at      TEXT,
  canal                 TEXT,
  last_error_code       TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at          TEXT
);

CREATE INDEX idx_comunicacion_intenciones_dispatch
  ON comunicacion_intenciones (estado, next_attempt_at, created_at);
CREATE INDEX idx_comunicacion_intenciones_reserva
  ON comunicacion_intenciones (reserva_id, created_at);

CREATE TABLE comunicacion_intentos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  intencion_uid         TEXT NOT NULL
                        REFERENCES comunicacion_intenciones(intencion_uid) ON DELETE RESTRICT,
  delivery_uid          TEXT NOT NULL UNIQUE,
  canal                 TEXT,
  resultado             TEXT NOT NULL
                        CHECK (resultado IN ('entregada', 'retry', 'sin_canal', 'dead_letter')),
  error_code            TEXT,
  started_at            TEXT NOT NULL,
  completed_at          TEXT NOT NULL
);

CREATE INDEX idx_comunicacion_intentos_intencion
  ON comunicacion_intentos (intencion_uid, started_at);

INSERT INTO comunicacion_plantillas (
  codigo, intencion, idioma, version, estado, asunto_template, cuerpo_template, published_at
) VALUES
  ('reserva_creada', 'reserva_creada', 'es', 1, 'publicada',
   'Recibimos tu reserva {{reserva_codigo}}',
   'Tu solicitud de reserva fue recibida. Conservá el código {{reserva_codigo}}.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_creada', 'reserva_creada', 'en', 1, 'publicada',
   'We received your booking {{reserva_codigo}}',
   'Your booking request was received. Keep the code {{reserva_codigo}}.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_pendiente', 'pago_pendiente', 'es', 1, 'publicada',
   'Pago pendiente para {{reserva_codigo}}',
   'Tu reserva está pendiente de pago. Usá únicamente las instrucciones del sitio.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_pendiente', 'pago_pendiente', 'en', 1, 'publicada',
   'Payment pending for {{reserva_codigo}}',
   'Your booking is awaiting payment. Use only the instructions shown on the website.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_aprobado', 'pago_aprobado', 'es', 1, 'publicada',
   'Pago confirmado para {{reserva_codigo}}',
   'Recibimos el pago y confirmamos tu reserva {{reserva_codigo}}.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_aprobado', 'pago_aprobado', 'en', 1, 'publicada',
   'Payment confirmed for {{reserva_codigo}}',
   'We received the payment and confirmed your booking {{reserva_codigo}}.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_vencida', 'reserva_vencida', 'es', 1, 'publicada',
   'Venció la retención de {{reserva_codigo}}',
   'La retención de tu reserva venció antes de acreditarse el pago.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_vencida', 'reserva_vencida', 'en', 1, 'publicada',
   'Booking hold expired for {{reserva_codigo}}',
   'Your booking hold expired before payment was received.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_modificada', 'reserva_modificada', 'es', 1, 'publicada',
   'Actualizamos tu reserva {{reserva_codigo}}',
   'Tu reserva fue actualizada. Revisá los datos vigentes en tu confirmación.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_modificada', 'reserva_modificada', 'en', 1, 'publicada',
   'We updated your booking {{reserva_codigo}}',
   'Your booking was updated. Review the current details in your confirmation.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_cancelada', 'reserva_cancelada', 'es', 1, 'publicada',
   'Reserva cancelada {{reserva_codigo}}',
   'Tu reserva fue cancelada. Cualquier devolución se informa por separado.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_cancelada', 'reserva_cancelada', 'en', 1, 'publicada',
   'Booking cancelled {{reserva_codigo}}',
   'Your booking was cancelled. Any refund is communicated separately.',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TRIGGER reserva_eventos_to_comunicacion_intenciones
AFTER INSERT ON reserva_eventos
WHEN NEW.tipo IN (
  'reserva.creada', 'reserva.creada_admin', 'reserva.retencion_iniciada',
  'pago.pendiente', 'pago.aprobado', 'reserva.retencion_vencida',
  'reserva.modificada_admin', 'reserva.cancelada'
)
BEGIN
  INSERT OR IGNORE INTO comunicacion_intenciones (
    intencion_uid, dedupe_key, reserva_id, source_event_uid, tipo, idioma,
    plantilla_codigo, plantilla_version
  )
  SELECT
    'comunicacion:' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    'reserva:' || NEW.reserva_id || ':' ||
      CASE
        WHEN NEW.tipo IN ('reserva.creada', 'reserva.creada_admin') THEN 'reserva_creada'
        WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
        WHEN NEW.tipo = 'pago.aprobado' THEN 'pago_aprobado'
        WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
        WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
        ELSE 'reserva_cancelada'
      END || ':' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    NEW.reserva_id,
    COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    CASE
      WHEN NEW.tipo IN ('reserva.creada', 'reserva.creada_admin') THEN 'reserva_creada'
      WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
      WHEN NEW.tipo = 'pago.aprobado' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END,
    r.idioma_comunicacion, p.codigo, p.version
  FROM reservas r
  JOIN comunicacion_plantillas p ON p.idioma = r.idioma_comunicacion
  WHERE p.intencion = CASE
      WHEN NEW.tipo IN ('reserva.creada', 'reserva.creada_admin') THEN 'reserva_creada'
      WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
      WHEN NEW.tipo = 'pago.aprobado' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END
    AND r.id = NEW.reserva_id AND p.estado = 'publicada';
END;

CREATE TRIGGER comunicacion_intenciones_to_integration_outbox
AFTER INSERT ON comunicacion_intenciones
BEGIN
  INSERT OR IGNORE INTO integration_outbox (
    event_id, event_type, schema_version, aggregate_type, aggregate_id,
    payload_json, occurred_at
  ) VALUES (
    NEW.intencion_uid,
    'comunicacion.intencion_creada',
    1,
    'comunicacion',
    NEW.intencion_uid,
    json_object(
      'event_id', NEW.intencion_uid,
      'event_type', 'comunicacion.intencion_creada',
      'schema_version', 1,
      'aggregate_type', 'comunicacion',
      'aggregate_id', NEW.intencion_uid,
      'reservation_id', NEW.reserva_id,
      'intent_type', NEW.tipo,
      'language', NEW.idioma,
      'template_code', NEW.plantilla_codigo,
      'template_version', NEW.plantilla_version,
      'occurred_at', NEW.created_at
    ),
    NEW.created_at
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0026', 'intenciones de comunicacion independientes del canal',
        'migrations/0026_channel_neutral_communications.sql');
