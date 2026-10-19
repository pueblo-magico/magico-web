-- Notificaciones internas de reservas sobre el mismo outbox durable que usa
-- el correo al huesped. El destinatario del equipo se resuelve en runtime y
-- nunca se copia al outbox.

ALTER TABLE comunicacion_plantillas ADD COLUMN audiencia TEXT NOT NULL DEFAULT 'huesped'
  CHECK (audiencia IN ('huesped', 'equipo'));

ALTER TABLE comunicacion_intenciones ADD COLUMN audiencia TEXT NOT NULL DEFAULT 'huesped'
  CHECK (audiencia IN ('huesped', 'equipo'));

DROP INDEX idx_comunicacion_plantilla_publicada;
CREATE UNIQUE INDEX idx_comunicacion_plantilla_publicada
  ON comunicacion_plantillas (intencion, idioma)
  WHERE estado = 'publicada' AND audiencia = 'huesped';
CREATE UNIQUE INDEX idx_comunicacion_plantilla_equipo_publicada
  ON comunicacion_plantillas (codigo, idioma)
  WHERE estado = 'publicada' AND audiencia = 'equipo';

DROP TRIGGER comunicacion_plantilla_publicada_inmutable_update;
CREATE TRIGGER comunicacion_plantilla_publicada_inmutable_update
BEFORE UPDATE ON comunicacion_plantillas
WHEN OLD.estado = 'publicada' AND NOT (
  NEW.estado = 'retirada'
  AND NEW.codigo = OLD.codigo
  AND NEW.intencion = OLD.intencion
  AND NEW.idioma = OLD.idioma
  AND NEW.version = OLD.version
  AND NEW.audiencia = OLD.audiencia
  AND NEW.asunto_template = OLD.asunto_template
  AND NEW.cuerpo_template = OLD.cuerpo_template
  AND NEW.created_at = OLD.created_at
  AND NEW.published_at IS OLD.published_at
)
BEGIN SELECT RAISE(ABORT, 'plantilla de comunicacion publicada es inmutable'); END;

INSERT INTO comunicacion_plantillas (
  codigo, intencion, idioma, version, estado, asunto_template, cuerpo_template,
  published_at, audiencia
) VALUES
  ('equipo_reserva_creada', 'reserva_creada', 'es', 1, 'publicada',
   'Nueva reserva {{reserva_codigo}} · {{fecha_checkin}}',
   'Nueva reserva registrada: {{reserva_codigo}}.\nHuésped: {{cliente_nombre}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nTotal: {{monto_total}}.\nEstado: {{estado_reserva}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo'),
  ('equipo_reserva_confirmada', 'pago_aprobado', 'es', 1, 'publicada',
   'Reserva confirmada {{reserva_codigo}} · {{fecha_checkin}}',
   'Se confirmó la reserva {{reserva_codigo}}.\nHuésped: {{cliente_nombre}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nTotal: {{monto_total}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo'),
  ('equipo_reserva_modificada', 'reserva_modificada', 'es', 1, 'publicada',
   'Reserva actualizada {{reserva_codigo}} · {{fecha_checkin}}',
   'Se actualizó la reserva {{reserva_codigo}}.\nHuésped: {{cliente_nombre}}.\nFechas vigentes: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nTotal: {{monto_total}}.\nEstado: {{estado_reserva}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo'),
  ('equipo_reserva_cancelada', 'reserva_cancelada', 'es', 1, 'publicada',
   'Reserva cancelada {{reserva_codigo}} · {{fecha_checkin}}',
   'Se canceló la reserva {{reserva_codigo}}.\nHuésped: {{cliente_nombre}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo'),
  ('equipo_reserva_vencida', 'reserva_vencida', 'es', 1, 'publicada',
   'Venció la reserva {{reserva_codigo}} · {{fecha_checkin}}',
   'Venció la retención de la reserva {{reserva_codigo}}.\nHuésped: {{cliente_nombre}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo'),
  ('equipo_llegada_proxima', 'pago_pendiente', 'es', 1, 'publicada',
   'Llegada próxima {{reserva_codigo}} · {{fecha_checkin}}',
   'La reserva {{reserva_codigo}} llega pronto.\nHuésped: {{cliente_nombre}}.\nCheck-in: {{fecha_checkin}}.\nCheck-out: {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nAlojamiento: {{alojamiento}} · {{modalidad}}.\nAbrir en Administración: {{admin_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'equipo');

DROP TRIGGER reserva_eventos_to_comunicacion_intenciones;
CREATE TRIGGER reserva_eventos_to_comunicacion_intenciones
AFTER INSERT ON reserva_eventos
WHEN NEW.tipo IN (
  'reserva.creada_admin', 'reserva.retencion_iniciada', 'pago.pendiente',
  'reserva.confirmada', 'reserva.retencion_vencida',
  'reserva.modificada_admin', 'reserva.cancelada'
)
BEGIN
  INSERT OR IGNORE INTO comunicacion_intenciones (
    intencion_uid, dedupe_key, reserva_id, source_event_uid, tipo, idioma,
    plantilla_codigo, plantilla_version, audiencia
  )
  SELECT
    'comunicacion:' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    'reserva:' || NEW.reserva_id || ':' ||
      CASE
        WHEN NEW.tipo = 'reserva.creada_admin' THEN 'reserva_creada'
        WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
        WHEN NEW.tipo = 'reserva.confirmada' THEN 'pago_aprobado'
        WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
        WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
        ELSE 'reserva_cancelada'
      END || ':' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    NEW.reserva_id,
    COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    CASE
      WHEN NEW.tipo = 'reserva.creada_admin' THEN 'reserva_creada'
      WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
      WHEN NEW.tipo = 'reserva.confirmada' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END,
    r.idioma_comunicacion, p.codigo, p.version, 'huesped'
  FROM reservas r
  JOIN comunicacion_plantillas p ON p.idioma = r.idioma_comunicacion
  WHERE p.intencion = CASE
      WHEN NEW.tipo = 'reserva.creada_admin' THEN 'reserva_creada'
      WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
      WHEN NEW.tipo = 'reserva.confirmada' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END
    AND r.id = NEW.reserva_id AND p.estado = 'publicada' AND p.audiencia = 'huesped';
END;

CREATE TRIGGER reserva_eventos_to_notificaciones_equipo
AFTER INSERT ON reserva_eventos
WHEN NEW.tipo IN (
  'reserva.creada', 'reserva.creada_admin', 'reserva.confirmada',
  'reserva.retencion_vencida', 'reserva.modificada_admin', 'reserva.cancelada'
)
BEGIN
  INSERT OR IGNORE INTO comunicacion_intenciones (
    intencion_uid, dedupe_key, reserva_id, source_event_uid, tipo, idioma,
    plantilla_codigo, plantilla_version, audiencia
  )
  SELECT
    'comunicacion:equipo:' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    'equipo:reserva:' || NEW.reserva_id || ':' ||
      COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    NEW.reserva_id,
    COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    CASE
      WHEN NEW.tipo IN ('reserva.creada', 'reserva.creada_admin') THEN 'reserva_creada'
      WHEN NEW.tipo = 'reserva.confirmada' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END,
    'es', p.codigo, p.version, 'equipo'
  FROM comunicacion_plantillas p
  WHERE p.codigo = CASE
      WHEN NEW.tipo IN ('reserva.creada', 'reserva.creada_admin') THEN 'equipo_reserva_creada'
      WHEN NEW.tipo = 'reserva.confirmada' THEN 'equipo_reserva_confirmada'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'equipo_reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'equipo_reserva_modificada'
      ELSE 'equipo_reserva_cancelada'
    END
    AND p.idioma = 'es' AND p.estado = 'publicada' AND p.audiencia = 'equipo';
END;

DROP TRIGGER comunicacion_intenciones_to_integration_outbox;
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
      'audience', NEW.audiencia,
      'language', NEW.idioma,
      'template_code', NEW.plantilla_codigo,
      'template_version', NEW.plantilla_version,
      'occurred_at', NEW.created_at
    ),
    NEW.created_at
  );
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0040', 'notificaciones internas y recordatorios de llegada',
        'migrations/0040_team_reservation_notifications.sql');
