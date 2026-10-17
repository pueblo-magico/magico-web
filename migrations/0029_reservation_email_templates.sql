-- Email-first delivery for reservation lifecycle communication intents.
-- Public reservations receive one combined pending-payment message rather than
-- separate creation and hold messages.

-- Existing installations may already have both intents queued for the same
-- public reservation. Resolve only the redundant public `reserva.creada`
-- delivery before replacing the trigger, leaving admin-created reservations
-- and every already completed delivery untouched.
UPDATE integration_outbox
SET estado = 'delivered',
    delivered_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    last_error_code = 'SUPERSEDED_BY_PAYMENT_PENDING',
    claim_uid = NULL,
    claimed_at = NULL,
    claim_expires_at = NULL
WHERE estado IN ('pending', 'processing')
  AND event_id IN (
    SELECT created.intencion_uid
    FROM comunicacion_intenciones created
    JOIN reserva_eventos source
      ON source.evento_uid = created.source_event_uid
     AND source.tipo = 'reserva.creada'
    WHERE created.tipo = 'reserva_creada'
      AND created.estado IN ('pendiente', 'procesando')
      AND EXISTS (
        SELECT 1
        FROM comunicacion_intenciones pending
        WHERE pending.reserva_id = created.reserva_id
          AND pending.tipo = 'pago_pendiente'
      )
  );

UPDATE comunicacion_intenciones
SET estado = 'sin_canal',
    canal = 'email',
    last_error_code = 'SUPERSEDED_BY_PAYMENT_PENDING',
    claim_uid = NULL,
    claimed_at = NULL,
    claim_expires_at = NULL
WHERE estado IN ('pendiente', 'procesando')
  AND tipo = 'reserva_creada'
  AND source_event_uid IN (
    SELECT evento_uid
    FROM reserva_eventos
    WHERE tipo = 'reserva.creada'
  )
  AND EXISTS (
    SELECT 1
    FROM comunicacion_intenciones pending
    WHERE pending.reserva_id = comunicacion_intenciones.reserva_id
      AND pending.tipo = 'pago_pendiente'
  );

UPDATE comunicacion_plantillas
SET estado = 'retirada'
WHERE estado = 'publicada' AND version = 1;

INSERT INTO comunicacion_plantillas (
  codigo, intencion, idioma, version, estado, asunto_template, cuerpo_template, published_at
) VALUES
  ('reserva_creada', 'reserva_creada', 'es', 2, 'publicada',
   'Reserva {{reserva_codigo}} registrada',
   'Registramos la reserva {{reserva_codigo}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nConsultá el estado actualizado: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_creada', 'reserva_creada', 'en', 2, 'publicada',
   'Booking {{reserva_codigo}} registered',
   'We registered booking {{reserva_codigo}}.\nDates: {{fecha_checkin}} to {{fecha_checkout}}.\nGuests: {{cantidad_personas}}.\nCheck its current status: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_pendiente', 'pago_pendiente', 'es', 2, 'publicada',
   'Completá la seña de tu reserva {{reserva_codigo}}',
   'Recibimos tu solicitud de reserva {{reserva_codigo}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nSeña: {{monto_sena}}.\nLa retención vence: {{expires_at}}.\nCompletá el pago o revisá el estado: {{payment_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_pendiente', 'pago_pendiente', 'en', 2, 'publicada',
   'Complete the deposit for booking {{reserva_codigo}}',
   'We received booking request {{reserva_codigo}}.\nDates: {{fecha_checkin}} to {{fecha_checkout}}.\nGuests: {{cantidad_personas}}.\nDeposit: {{monto_sena}}.\nThe hold expires: {{expires_at}}.\nComplete payment or check its status: {{payment_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_aprobado', 'pago_aprobado', 'es', 2, 'publicada',
   'Tu reserva {{reserva_codigo}} está confirmada',
   'Recibimos la seña y confirmamos tu reserva {{reserva_codigo}}.\nFechas: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nSeña recibida: {{monto_sena}}.\nVer tu reserva: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('pago_aprobado', 'pago_aprobado', 'en', 2, 'publicada',
   'Your booking {{reserva_codigo}} is confirmed',
   'We received the deposit and confirmed booking {{reserva_codigo}}.\nDates: {{fecha_checkin}} to {{fecha_checkout}}.\nGuests: {{cantidad_personas}}.\nDeposit received: {{monto_sena}}.\nView your booking: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_vencida', 'reserva_vencida', 'es', 2, 'publicada',
   'Venció la retención de {{reserva_codigo}}',
   'La retención de la reserva {{reserva_codigo}} venció antes de acreditarse el pago. El lugar ya no está retenido.\nConsultá el estado o iniciá una nueva reserva: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_vencida', 'reserva_vencida', 'en', 2, 'publicada',
   'The hold for {{reserva_codigo}} expired',
   'The hold for booking {{reserva_codigo}} expired before payment was credited. The place is no longer held.\nCheck the status or start a new booking: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_modificada', 'reserva_modificada', 'es', 2, 'publicada',
   'Actualizamos tu reserva {{reserva_codigo}}',
   'La reserva {{reserva_codigo}} fue actualizada.\nFechas vigentes: {{fecha_checkin}} al {{fecha_checkout}}.\nPersonas: {{cantidad_personas}}.\nRevisá los datos actuales: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_modificada', 'reserva_modificada', 'en', 2, 'publicada',
   'We updated booking {{reserva_codigo}}',
   'Booking {{reserva_codigo}} was updated.\nCurrent dates: {{fecha_checkin}} to {{fecha_checkout}}.\nGuests: {{cantidad_personas}}.\nReview the current details: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_cancelada', 'reserva_cancelada', 'es', 2, 'publicada',
   'Reserva cancelada {{reserva_codigo}}',
   'La reserva {{reserva_codigo}} fue cancelada. Cualquier devolución se informará por separado.\nVer estado: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('reserva_cancelada', 'reserva_cancelada', 'en', 2, 'publicada',
   'Booking cancelled {{reserva_codigo}}',
   'Booking {{reserva_codigo}} was cancelled. Any refund will be communicated separately.\nView status: {{status_url}}',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

DROP TRIGGER reserva_eventos_to_comunicacion_intenciones;

CREATE TRIGGER reserva_eventos_to_comunicacion_intenciones
AFTER INSERT ON reserva_eventos
WHEN NEW.tipo IN (
  'reserva.creada_admin', 'reserva.retencion_iniciada', 'pago.pendiente',
  'pago.aprobado', 'reserva.retencion_vencida',
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
        WHEN NEW.tipo = 'pago.aprobado' THEN 'pago_aprobado'
        WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
        WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
        ELSE 'reserva_cancelada'
      END || ':' || COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    NEW.reserva_id,
    COALESCE(NULLIF(trim(NEW.evento_uid), ''), 'reserva-evento:' || NEW.id),
    CASE
      WHEN NEW.tipo = 'reserva.creada_admin' THEN 'reserva_creada'
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
      WHEN NEW.tipo = 'reserva.creada_admin' THEN 'reserva_creada'
      WHEN NEW.tipo IN ('reserva.retencion_iniciada', 'pago.pendiente') THEN 'pago_pendiente'
      WHEN NEW.tipo = 'pago.aprobado' THEN 'pago_aprobado'
      WHEN NEW.tipo = 'reserva.retencion_vencida' THEN 'reserva_vencida'
      WHEN NEW.tipo = 'reserva.modificada_admin' THEN 'reserva_modificada'
      ELSE 'reserva_cancelada'
    END
    AND r.id = NEW.reserva_id AND p.estado = 'publicada';
END;

INSERT INTO schema_migrations (version, descripcion, checksum_ref)
VALUES ('0029', 'plantillas y entrega email de reservas',
        'migrations/0029_reservation_email_templates.sql');
