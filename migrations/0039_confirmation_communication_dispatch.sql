-- Unifica la comunicacion de confirmacion sobre el evento de reserva confirmado.
-- El mismo evento se proyecta tanto para pagos de Mercado Pago como para una
-- confirmacion administrativa, evitando que el canal dependa del origen del pago.

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
    plantilla_codigo, plantilla_version
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
    r.idioma_comunicacion, p.codigo, p.version
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
    AND r.id = NEW.reserva_id AND p.estado = 'publicada';
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0039', 'confirmacion de reserva independiente del origen del pago',
        'migrations/0039_confirmation_communication_dispatch.sql');
